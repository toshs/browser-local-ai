import { useState, useEffect, useRef } from 'react';
import { useTranslator } from '../../../hooks/useTranslator';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import {
    ArrowRightLeft,
    Copy,
    Check,
    Loader2,
    AlertCircle,
    Search
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../../services/ai/translate';
import { detectLanguage } from '../../../services/ai/detect';
import { LanguageSelector } from '../../ui/LanguageSelector';
import './TranslatorInterface.css';
import { DownloadOverlay } from '../../ui/DownloadOverlay';

interface TranslatorInterfaceProps {
    initialInput?: string;
}

export const TranslatorInterface = ({ initialInput }: TranslatorInterfaceProps) => {
    // Hook returns: { checkAvailability, translate, error, downloadProgress }
    const {
        error: translateError,
        translate,
        downloadProgress
    } = useTranslator();

    // Local state
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [availability, setAvailability] = useState<'available' | 'downloadable' | 'downloading' | 'unavailable' | 'loading'>('loading');

    const [inputText, setInputText] = useState(initialInput || '');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('ja');
    const [copied, setCopied] = useState(false);
    const [detectedLang, setDetectedLang] = useState<string | null>(null);
    const [detecting, setDetecting] = useState(false);

    const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevInputRef = useRef(inputText);

    const isDesktop = useMediaQuery('(min-width: 900px)'); // Increased breakpoint for 3-col layout

    // Initialize target language based on browser detection
    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        // Check if browser lang is supported
        const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang);
        if (isSupported) {
            setTargetLang(browserLang);
        }
    }, []);

    // Check availability on mount
    useEffect(() => {
        if (typeof Translator !== 'undefined') {
            Translator.availability({ sourceLanguage: 'en', targetLanguage: 'ja' })
                .then(available => setAvailability(available))
                .catch(() => setAvailability('unavailable'));
        } else {
            setAvailability('unavailable');
        }
    }, []);

    useEffect(() => {
        if (initialInput) {
            setInputText(initialInput);
            handleDetectLanguage(initialInput);
        }
    }, [initialInput]);

    // Auto-detect language when user stops typing
    useEffect(() => {
        if (detectTimerRef.current) {
            clearTimeout(detectTimerRef.current);
        }

        if (sourceLang !== 'auto' || !inputText.trim() || inputText === prevInputRef.current) {
            if (!inputText.trim()) setDetectedLang(null);
            prevInputRef.current = inputText;
            return;
        }

        prevInputRef.current = inputText;

        detectTimerRef.current = setTimeout(() => {
            handleDetectLanguage(inputText);
        }, 800);

        return () => {
            if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
        };
    }, [inputText, sourceLang]);


    const handleDetectLanguage = async (text: string) => {
        if (!text.trim()) return;
        setDetecting(true);
        try {
            const detected = await detectLanguage(text);
            if (detected && detected.length > 0) {
                setDetectedLang(detected[0].detectedLanguage);
            }
        } catch (e) {
            console.warn("Detection failed", e);
        } finally {
            setDetecting(false);
        }
    };

    const handleTranslate = async () => {
        if (!inputText.trim()) return;

        let actualSource = sourceLang;
        if (sourceLang === 'auto' && detectedLang) {
            actualSource = detectedLang;
        } else if (sourceLang === 'auto') {
            // Try one more detect
            const detected = await detectLanguage(inputText);
            if (detected && detected.length > 0) {
                actualSource = detected[0].detectedLanguage;
            } else {
                actualSource = 'en';
            }
        }

        setIsLoading(true);
        try {
            // Replace newlines with <br> tags to preserve formatting
            const formattedInput = inputText.replace(/\n/g, '<br>');
            const res = await translate(formattedInput, { sourceLanguage: actualSource, targetLanguage: targetLang });
            // Revert <br> tags back to newlines for display
            const formattedResult = res.replace(/<br\s*\/?>/gi, '\n');
            setResult(formattedResult);
        } catch (e) {
            // error handled by hook
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') {
            if (detectedLang) {
                setSourceLang(targetLang);
                setTargetLang(detectedLang);
            }
            return;
        }
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        if (result) {
            setInputText(result);
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
            <div className="translator-container empty-state">
                <div className="empty-state-content">
                    <AlertCircle size={48} className="text-muted" />
                    <h3>Translator API Unavailable</h3>
                    <p>The Translator API is not available in this browser. Please use Chrome Canary and enable the AI functionalities.</p>
                </div>
            </div>
        );
    }

    const languageOptions = [
        { code: 'auto', name: '✨ Auto' },
        ...SUPPORTED_LANGUAGES
    ];

    return (
        <div className={`translator-container ${isDesktop ? 'desktop-3-col' : ''}`}>
            {downloadProgress && (
                <DownloadOverlay loaded={downloadProgress.loaded} total={downloadProgress.total} />
            )}

            {/* Column 1 (Desktop) / Top (Mobile): Input */}
            <div className="layout-section input-section">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text..."
                    className="source-input"
                />
            </div>

            {/* Column 2 (Desktop) / Middle (Mobile): Controls */}
            <div className="layout-section controls-section">
                <div className="controls-wrapper">
                    <div className="lang-selectors-group">
                        <LanguageSelector
                            value={sourceLang}
                            onChange={(val) => { setSourceLang(val); setDetectedLang(null); }}
                            options={languageOptions}
                            suffix={sourceLang === 'auto' && detectedLang ? (SUPPORTED_LANGUAGES.find(l => l.code === detectedLang)?.name || detectedLang) : undefined}
                            className="lang-select-wrapper"
                        />

                        <button
                            className="swap-btn"
                            onClick={handleSwapLanguages}
                            title="Swap languages"
                            disabled={sourceLang === 'auto' && !detectedLang}
                        >
                            <ArrowRightLeft size={18} />
                        </button>

                        <LanguageSelector
                            value={targetLang}
                            onChange={setTargetLang}
                            options={SUPPORTED_LANGUAGES}
                            className="lang-select-wrapper"
                        />
                    </div>
                    {detecting && (
                        <div className="detected-lang-info">
                            <Search size={12} style={{ marginRight: 4 }} />
                            <span>Detecting...</span>
                        </div>
                    )}
                </div>

                <button
                    className="translate-btn"
                    onClick={handleTranslate}
                    disabled={isLoading || !inputText.trim()}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Translating...</span>
                        </>
                    ) : (
                        <span>Translate</span>
                    )}
                </button>
            </div>

            {/* Column 3 (Desktop) / Bottom (Mobile): Result */}
            <div className="layout-section result-section">
                <div className="translation-result">
                    <div className="result-header">
                        <span className="result-label">Result</span>
                        <button
                            className="action-btn icon-only"
                            onClick={copyToClipboard}
                            title="Copy to clipboard"
                            disabled={!result}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                    <div className="result-content">
                        {translateError ? (
                            <div className="error-message">
                                <AlertCircle size={16} />
                                <span>{translateError}</span>
                            </div>
                        ) : (
                            <div className="translated-text">
                                {result || <span className="placeholder-text">Translation will appear here...</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
