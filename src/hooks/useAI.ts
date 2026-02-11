import { useState, useEffect, useCallback, useRef } from 'react';
import { checkAI, generateText, generateTextStream } from '../services/ai';
import type { DownloadProgress } from '../services/ai';

export const useAI = () => {
    const [availability, setAvailability] = useState<'readily' | 'after-download' | 'no' | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        checkAI().then(res => setAvailability(res.available));
    }, []);

    const promptText = useCallback(async (input: string) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setError(null);
            setDownloadProgress(null);
            return await generateText(input, (progress) => {
                setDownloadProgress(progress);
            }, abortControllerRef.current.signal);
        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log('Prompt aborted');
                throw e;
            }
            setError(e.message || 'Unknown error');
            throw e;
        } finally {
            abortControllerRef.current = null;
        }
    }, []);

    const streamText = useCallback(async (
        input: string,
        onChunk: (chunk: string) => void,
    ) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setError(null);
            setDownloadProgress(null);
            const stream = generateTextStream(input, (progress) => {
                setDownloadProgress(progress);
            }, abortControllerRef.current.signal);

            for await (const chunk of stream) {
                onChunk(chunk);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log('Stream aborted');
                throw e;
            }
            setError(e.message || 'Unknown error');
            throw e;
        } finally {
            abortControllerRef.current = null;
        }
    }, []);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return { availability, promptText, streamText, abort, error, downloadProgress };
};
