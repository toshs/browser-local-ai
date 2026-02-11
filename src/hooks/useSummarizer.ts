import { useState, useEffect, useCallback } from 'react';
import { checkSummarizer, summarizeText } from '../services/ai';
import type { AISummarizerCreateOptions } from '../types/window-ai';
import type { DownloadProgress } from '../services/ai';

export const useSummarizer = () => {
    const [availability, setAvailability] = useState<'readily' | 'after-download' | 'no' | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    useEffect(() => {
        checkSummarizer().then(res => setAvailability(res.available));
    }, []);

    const summarize = useCallback(async (input: string, options?: AISummarizerCreateOptions) => {
        try {
            setError(null);
            setDownloadProgress(null);
            return await summarizeText(input, options, (progress) => {
                setDownloadProgress(progress);
            });
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            throw e;
        } finally {
            setDownloadProgress(null);
        }
    }, []);

    return { availability, summarize, error, downloadProgress };
};
