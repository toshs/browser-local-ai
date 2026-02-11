import { useState, useEffect } from 'react';
import { useSummarizer } from '../../../hooks/useSummarizer';
import { Loader2, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { OptionSelector, type Option } from '../../ui/OptionSelector';
import './SummarizerInterface.css';
import { DownloadOverlay } from '../../ui/DownloadOverlay';

interface SummarizerInterfaceProps {
    initialInput?: string;
}

export const SummarizerInterface = ({ initialInput }: SummarizerInterfaceProps) => {
    // Hooks return { availability, summarizeStreaming, error, downloadProgress }
    const { availability, summarizeStreaming, error: hookError, downloadProgress } = useSummarizer();

    // Local state for results since hook doesn't store them
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [inputText, setInputText] = useState(initialInput || '');
    const [type, setType] = useState<'key-points' | 'tldr' | 'teaser' | 'headline'>('key-points');
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [format, setFormat] = useState<'markdown' | 'plain-text'>('markdown');
    const [outputLanguage, setOutputLanguage] = useState('en');
    const [context, setContext] = useState(''); // New context state
    const [copied, setCopied] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Sync hook error to local error
    useEffect(() => {
        if (hookError) setError(hookError);
    }, [hookError]);

    // Initialize output language based on browser detection if possible, or default to English
    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        // The error message says supported codes are [en, es, ja]
        // We can try to match browser lang to these, otherwise default to 'en'
        const supported = ['en', 'es', 'ja'];
        if (supported.includes(browserLang)) {
            setOutputLanguage(browserLang);
        }
    }, []);

    // Effect to updateinputText if initialInput changes (e.g. from context menu)
    useEffect(() => {
        if (initialInput) {
            setInputText(initialInput);
        }
    }, [initialInput]);

    const handleSummarize = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(''); // Clear previous result

        try {
            const languageNames: Record<string, string> = {
                'en': 'English',
                'ja': 'Japanese',
                'es': 'Spanish'
            };
            const langName = languageNames[outputLanguage] || outputLanguage;

            // Use streaming by default for better UX
            const stream = summarizeStreaming(inputText, {
                type,
                length,
                format,
                outputLanguage: outputLanguage,
                expectedInputLanguages: ['en', 'ja', 'es'], // Support common languages
                expectedContextLanguages: ['en', 'ja', 'es'],
                sharedContext: `The user expects the output in ${langName}.`,
            }, {
                context: context.trim() || undefined
            });

            for await (const chunk of stream) {
                setResult((prev) => {
                    if (!prev) return chunk;
                    // If the new chunk contains the previous text, it's an accumulated update
                    if (chunk.startsWith(prev)) {
                        return chunk;
                    }
                    // Otherwise, we assume it's a delta and append it
                    return prev + chunk;
                });
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to summarize');
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

    if (availability === 'unavailable') {
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

    if (availability === 'loading') {
        return (
            <div className="summarizer-container empty-state">
                <div className="empty-state-content">
                    <Loader2 className="animate-spin text-muted" size={48} />
                    <h3>Checking API Availability...</h3>
                </div>
            </div>
        )
    }

    // Define options with descriptions
    const typeOptions: Option[] = [
        { value: 'key-points', label: 'Key Points', description: 'Extracts the main points.' },
        { value: 'tldr', label: 'TL;DR', description: 'Very concise summary.' },
        { value: 'teaser', label: 'Teaser', description: 'A short preview.' },
        { value: 'headline', label: 'Headline', description: 'A catchy headline.' }
    ];

    const lengthOptions: Option[] = [
        { value: 'short', label: 'Short', description: 'Brief.' },
        { value: 'medium', label: 'Medium', description: 'Balanced.' },
        { value: 'long', label: 'Long', description: 'Detailed.' }
    ];

    const formatOptions: Option[] = [
        { value: 'markdown', label: 'Markdown', description: 'Formatted text.' },
        { value: 'plain-text', label: 'Plain Text', description: 'Simple text.' }
    ];

    const languageOptions: Option[] = [
        { value: 'en', label: 'English' },
        { value: 'ja', label: 'Japanese' },
        { value: 'es', label: 'Spanish' }
    ];

    return (
        <div className={`summarizer-container ${isDesktop ? 'desktop-split' : ''}`}>
            {downloadProgress && (
                <DownloadOverlay loaded={downloadProgress.loaded} total={downloadProgress.total} />
            )}
            <div className="input-section">
                <div className="controls-group">
                    <OptionSelector
                        label="Type"
                        value={type}
                        onChange={(val: string) => setType(val as any)}
                        options={typeOptions}
                    />
                    <OptionSelector
                        label="Length"
                        value={length}
                        onChange={(val: string) => setLength(val as any)}
                        options={lengthOptions}
                    />
                    <OptionSelector
                        label="Format"
                        value={format}
                        onChange={(val: string) => setFormat(val as any)}
                        options={formatOptions}
                    />
                    <OptionSelector
                        label="Output Language"
                        value={outputLanguage}
                        onChange={(val: string) => setOutputLanguage(val)}
                        options={languageOptions}
                    />
                </div>

                <div className="input-area">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste text or content to summarize..."
                        className="source-input"
                    />
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Optional: Add context (e.g. 'Targeting expert audience')"
                        className="context-input"
                        rows={2}
                        style={{ marginTop: '8px', fontSize: '0.9em', minHeight: '60px' }}
                    />
                </div>

                <button
                    className="summarize-btn"
                    onClick={handleSummarize}
                    disabled={isLoading || !inputText.trim()}
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
