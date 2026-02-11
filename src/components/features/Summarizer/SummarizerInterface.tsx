import { useState, useEffect } from 'react';
import { useSummarizer } from '../../../hooks/useSummarizer';
import { Loader2, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import './SummarizerInterface.css';

interface SummarizerInterfaceProps {
    initialInput?: string;
}

export const SummarizerInterface = ({ initialInput }: SummarizerInterfaceProps) => {
    // Hooks return { availability, summarize, error, downloadProgress }
    const { availability, summarize, error: hookError } = useSummarizer();

    // Local state for results since hook doesn't store them
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [inputText, setInputText] = useState(initialInput || '');
    const [type, setType] = useState<'key-points' | 'tldr' | 'teaser' | 'headline'>('key-points');
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [format, setFormat] = useState<'markdown' | 'plain-text'>('markdown');
    const [copied, setCopied] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Sync hook error to local error
    useEffect(() => {
        if (hookError) setError(hookError);
    }, [hookError]);

    // Effect to update inputText if initialInput changes (e.g. from context menu)
    useEffect(() => {
        if (initialInput) {
            setInputText(initialInput);
        }
    }, [initialInput]);

    const handleSummarize = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const summary = await summarize(inputText, {
                type,
                length,
                format
            });
            setResult(summary);
        } catch (e) {
            // Error handled by hook or caught here
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (availability === ('no' as any)) { // Force check since type overlap issue might exist
        return (
            <div className="summarizer-container empty-state">
                <div className="empty-state-content">
                    <AlertCircle size={48} className="text-muted" />
                    <h3>Summarizer API Unavailable</h3>
                    <p>The Summarizer API is not available in this browser. Please use Chrome Canary and enable the AI functionalities.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`summarizer-container ${isDesktop ? 'desktop-split' : ''}`}>
            <div className="input-section">
                <div className="controls-group">
                    <div className="control-item">
                        <label>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value as any)}>
                            <option value="key-points">Key Points</option>
                            <option value="tldr">TL;DR</option>
                            <option value="teaser">Teaser</option>
                            <option value="headline">Headline</option>
                        </select>
                    </div>
                    <div className="control-item">
                        <label>Length</label>
                        <select value={length} onChange={(e) => setLength(e.target.value as any)}>
                            <option value="short">Short</option>
                            <option value="medium">Medium</option>
                            <option value="long">Long</option>
                        </select>
                    </div>
                    <div className="control-item">
                        <label>Format</label>
                        <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                            <option value="markdown">Markdown</option>
                            <option value="plain-text">Plain Text</option>
                        </select>
                    </div>
                </div>

                <div className="input-area">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste text or content to summarize..."
                        className="source-input"
                    />
                </div>

                <button
                    className="summarize-btn"
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText.trim() || availability === ('no' as any)}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Summarizing...</span>
                        </>
                    ) : (
                        <>
                            <FileText size={16} />
                            <span>Summarize</span>
                        </>
                    )}
                </button>
                {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}
            </div>

            <div className="result-section">
                {result ? (
                    <div className="summary-result">
                        <div className="result-header">
                            <span className="result-label">Summary</span>
                            <button
                                className="action-btn icon-only"
                                onClick={copyToClipboard}
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <div className="markdown-content">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="empty-result-placeholder">
                        <p>Summary will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};
