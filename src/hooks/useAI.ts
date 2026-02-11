import { useState, useEffect, useCallback } from 'react';
import { checkAI, generateText, generateTextStream } from '../services/ai';
import type { DownloadProgress } from '../services/ai';

export const useAI = () => {
    const [availability, setAvailability] = useState<'readily' | 'after-download' | 'no' | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    useEffect(() => {
        checkAI().then(res => setAvailability(res.available));
    }, []);

    const promptText = useCallback(async (input: string) => {
        try {
            setError(null);
            setDownloadProgress(null);
            return await generateText(input, (progress) => {
                setDownloadProgress(progress);
            });
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            throw e;
        }
    }, []);

    const streamText = useCallback(async (
        input: string,
        onChunk: (chunk: string) => void,
    ) => {
        try {
            setError(null);
            setDownloadProgress(null);
            const stream = generateTextStream(input, (progress) => {
                setDownloadProgress(progress);
            });
            for await (const chunk of stream) {
                onChunk(chunk);
            }
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            throw e;
        }
    }, []);

    return { availability, promptText, streamText, error, downloadProgress };
};
