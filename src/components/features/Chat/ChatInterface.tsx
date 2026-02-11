import { useState, useEffect, useRef, useCallback } from 'react';
import { useAI } from '../../../hooks/useAI';
import { useChatHistory, type Message } from '../../../hooks/useChatHistory';
import { Send, Copy, Check, Zap, Radio, StopCircle, Plus, History, Trash2, X } from 'lucide-react';
import './ChatInterface.css';
import { DownloadOverlay } from '../../ui/DownloadOverlay';
import * as smd from 'streaming-markdown';


interface ChatInterfaceProps {
    initialInput?: string;
}

export const ChatInterface = ({ initialInput }: ChatInterfaceProps) => {
    const { availability, promptText, streamText, abort, downloadProgress } = useAI();
    const { currentSession, createNewSession, addMessageToSession, sessions, selectSession, deleteSession } = useChatHistory();
    // const [messages, setMessages] = useState<Message[]>([]); // Now using currentSession.messages
    const [input, setInput] = useState(initialInput || '');
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [useStreaming, setUseStreaming] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const streamTargetRef = useRef<HTMLDivElement>(null);
    const parserRef = useRef<smd.Parser | null>(null);

    // Sync initialInput changes (e.g. from context menu actions)
    useEffect(() => {
        if (initialInput) {
            setInput(initialInput);
        }
    }, [initialInput]);

    const handleCopy = useCallback(async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);


    // We need a local state for the streaming content that hasn't been saved to history yet
    const [streamingContent, setStreamingContent] = useState<string | null>(null);

    const handleSend = async () => {
        if (!input.trim() || loading || !currentSession) return;

        const userText = input;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() };

        addMessageToSession(currentSession.id, userMsg);
        setInput('');
        setLoading(true);

        try {
            if (useStreaming) {
                let fullText = '';
                setStreamingContent(''); // Start streaming

                await streamText(userText, (chunk) => {
                    fullText += chunk;
                    setStreamingContent(prev => (prev || '') + chunk);

                    if (parserRef.current) {
                        smd.parser_write(parserRef.current, chunk);
                    }
                });

                if (parserRef.current) {
                    smd.parser_end(parserRef.current);
                    parserRef.current = null;
                }

                const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: fullText, timestamp: Date.now() };
                addMessageToSession(currentSession.id, aiMsg);

            } else {
                const response = await promptText(userText);
                const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: response, timestamp: Date.now() };
                addMessageToSession(currentSession.id, aiMsg);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: "Error: Could not generate response.", timestamp: Date.now() };
                addMessageToSession(currentSession.id, errorMsg);
            } else {
                // If aborted, save what we have so far
                if (useStreaming && streamingContent) { // streamingContent ref might be better but state is usually fine here as we await
                    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: streamingContent + " [Aborted]", timestamp: Date.now() };
                    addMessageToSession(currentSession.id, aiMsg);
                }
            }
        } finally {
            if (parserRef.current) {
                smd.parser_end(parserRef.current);
                parserRef.current = null;
            }
            setStreamingContent(null);
            setLoading(false);
        }
    };

    const handleStop = () => {
        abort();
        setLoading(false);
        // Save partial? The catch block handles it if abort throws. 
        // useAI throws AbortError.
    };

    const messages = currentSession?.messages || [];

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (loading && useStreaming && streamTargetRef.current) {
            streamTargetRef.current.innerHTML = '';
            const renderer = smd.default_renderer(streamTargetRef.current);
            parserRef.current = smd.parser(renderer);
        }
    }, [loading, useStreaming]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {downloadProgress && (
                <DownloadOverlay loaded={downloadProgress.loaded} total={downloadProgress.total} />
            )}
            {/* Header controls */}
            <div className="chat-header-controls">
                <button className="icon-btn" onClick={() => setShowHistory(!showHistory)} title="History">
                    <History size={18} />
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentSession?.title || 'New Chat'}
                </div>
                <button className="icon-btn" onClick={() => createNewSession()} title="New Chat">
                    <Plus size={18} />
                </button>
            </div>

            {/* History Sidebar/Overlay */}
            {showHistory && (
                <div className="history-overlay">
                    <div className="history-header">
                        <span>Chat History</span>
                        <button onClick={() => setShowHistory(false)}><X size={18} /></button>
                    </div>
                    <div className="history-list">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className={`history-item ${session.id === currentSession?.id ? 'active' : ''}`}
                                onClick={() => { selectSession(session.id); setShowHistory(false); }}
                            >
                                <span className="history-title">{session.title}</span>
                                <button
                                    className="history-delete"
                                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem' }}>
                {messages.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        <p>Ask me anything...</p>
                        <span className={`badge ${availability}`}>AI Status: {availability}</span>
                        {availability === 'unavailable' && (
                            <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                                Note: The Prompt API is currently only available in the Chrome Extension version or browsers with the API explicitly enabled.
                            </p>
                        )}
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', position: 'relative' }}>
                        <div style={{
                            background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--surface-color)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                            borderBottomLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                        }}>
                            {msg.role === 'ai' ? (
                                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                            ) : (
                                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                            )}
                        </div>
                        {msg.role === 'ai' && (
                            <button
                                onClick={() => handleCopy(msg.text, msg.id)}
                                style={{
                                    position: 'absolute', top: '4px', right: '4px',
                                    background: 'var(--surface-hover)', padding: '4px',
                                    borderRadius: '4px', opacity: 0.7,
                                }}
                                title="Copy"
                            >
                                {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                        )}
                    </div>
                ))}

                {loading && (
                    <>
                        {streamingContent !== null ? (
                            <div style={{
                                alignSelf: 'flex-start', maxWidth: '85%',
                                background: 'var(--surface-color)',
                                padding: '0.75rem', borderRadius: '12px', borderBottomLeftRadius: '2px',
                            }}>
                                <div ref={streamTargetRef} className="markdown-body" />
                            </div>
                        ) : (
                            // Thinking state if not streaming yet
                            useStreaming ? null : (
                                <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem' }}>
                                    Thinking...
                                </div>
                            )
                        )}
                    </>
                )}
                <div ref={endRef} />
            </div>

            <div style={{ flexShrink: 0, display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', alignItems: 'flex-end' }}>
                <button
                    onClick={() => setUseStreaming(!useStreaming)}
                    title={useStreaming ? 'Streaming mode (click to switch to prompt)' : 'Prompt mode (click to switch to streaming)'}
                    style={{
                        background: 'transparent', padding: '6px',
                        color: useStreaming ? 'var(--primary-color)' : 'var(--text-secondary)',
                        flexShrink: 0,
                    }}
                >
                    {useStreaming ? <Radio size={18} /> : <Zap size={18} />}
                </button>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type a message (Ctrl+Enter to send)..."
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '60px', padding: '0.75rem' }}
                />
                <button
                    onClick={loading ? handleStop : handleSend}
                    disabled={(!input.trim() && !loading) || availability === 'unavailable'}
                    className={loading ? "stop-btn" : "primary"}
                >
                    {loading ? <StopCircle size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
};

// Simple markdown-to-HTML for completed messages
function renderMarkdown(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
}
