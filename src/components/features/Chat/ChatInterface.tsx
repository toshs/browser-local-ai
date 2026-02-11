import { useState, useEffect, useRef, useCallback } from 'react';
import { useAI } from '../../../hooks/useAI';
import { Send, Download, Copy, Check, Zap, Radio } from 'lucide-react';
import * as smd from 'streaming-markdown';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
}

interface ChatInterfaceProps {
    initialInput?: string;
}

export const ChatInterface = ({ initialInput }: ChatInterfaceProps) => {
    const { availability, promptText, streamText, downloadProgress } = useAI();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState(initialInput || '');
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [useStreaming, setUseStreaming] = useState(true);
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

    const handleSendStreaming = async (userMsg: Message) => {
        const aiMsgId = (Date.now() + 1).toString();
        let fullText = '';

        try {
            await streamText(userMsg.text, (chunk) => {
                fullText += chunk;
                if (parserRef.current) {
                    smd.parser_write(parserRef.current, chunk);
                }
            });

            if (parserRef.current) {
                smd.parser_end(parserRef.current);
                parserRef.current = null;
            }

            setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: fullText, timestamp: Date.now() }]);
        } catch (_e) {
            if (parserRef.current) {
                smd.parser_end(parserRef.current);
                parserRef.current = null;
            }
            setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: "Error: Could not generate response.", timestamp: Date.now() }]);
        }
    };

    const handleSendPrompt = async (userMsg: Message) => {
        const aiMsgId = (Date.now() + 1).toString();

        try {
            const response = await promptText(userMsg.text);
            setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: response, timestamp: Date.now() }]);
        } catch (_e) {
            setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: "Error: Could not generate response.", timestamp: Date.now() }]);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (useStreaming) {
                await handleSendStreaming(userMsg);
            } else {
                await handleSendPrompt(userMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Initialize streaming markdown parser when loading starts (streaming mode only)
    useEffect(() => {
        if (loading && useStreaming && streamTargetRef.current) {
            streamTargetRef.current.innerHTML = '';
            const renderer = smd.default_renderer(streamTargetRef.current);
            parserRef.current = smd.parser(renderer);
        }
    }, [loading, useStreaming]);

    const progressPercent = downloadProgress
        ? Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem' }}>
                {messages.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        <p>Ask me anything...</p>
                        <span className={`badge ${availability}`}>AI Status: {availability}</span>
                        {availability === 'no' && (
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
                        {progressPercent !== null && (
                            <div style={{ maxWidth: '85%' }}>
                                <div className="card" style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <Download size={14} />
                                        <span>Downloading model... {progressPercent}%</span>
                                    </div>
                                    <div style={{ marginTop: '0.25rem', height: '4px', borderRadius: '2px', background: 'var(--surface-hover)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--primary-color)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {useStreaming ? (
                            <div style={{
                                alignSelf: 'flex-start', maxWidth: '85%',
                                background: 'var(--surface-color)',
                                padding: '0.75rem', borderRadius: '12px', borderBottomLeftRadius: '2px',
                            }}>
                                <div ref={streamTargetRef} className="markdown-body" />
                            </div>
                        ) : (
                            <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem' }}>
                                Thinking...
                            </div>
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
                <button onClick={handleSend} disabled={loading || !input.trim() || availability === 'no'} className="primary">
                    <Send size={18} />
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
