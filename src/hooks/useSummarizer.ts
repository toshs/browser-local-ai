import { useState, useEffect, useCallback } from 'react';
import { checkSummarizer, summarizeText, summarizeTextStreaming } from '../services/ai';
import type { AISummarizerCreateOptions } from '../types/window-ai';
import type { DownloadProgress } from '../services/ai';

export const useSummarizer = () => {
    const [availability, setAvailability] = useState<'available' | 'downloadable' | 'downloading' | 'unavailable' | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    useEffect(() => {
        checkSummarizer().then(res => setAvailability(res.available));
    }, []);

    const summarize = useCallback(async (input: string, options?: AISummarizerCreateOptions, runOptions?: { context?: string }) => {
        try {
            setError(null);
            setDownloadProgress(null);
            return await summarizeText(input, options, (progress) => {
                setDownloadProgress(progress);
            }, runOptions);
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            throw e;
        } finally {
            setDownloadProgress(null);
        }
    }, []);

    const summarizeStreaming = useCallback(async function* (input: string, options?: AISummarizerCreateOptions, runOptions?: { context?: string }) {
        try {
            setError(null);
            setDownloadProgress(null);
            const stream = summarizeTextStreaming(input, options, (progress) => {
                setDownloadProgress(progress);
            }, runOptions);

            for await (const chunk of stream) {
                yield chunk;
            }
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            throw e;
        } finally {
            setDownloadProgress(null);
        }
    }, []);

    return { availability, summarize, summarizeStreaming, error, downloadProgress };
};
