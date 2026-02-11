import { useState, useEffect, useCallback, useRef } from 'react';
import { checkAI } from '../services/ai';
import type { AILanguageModelSession } from '../types/window-ai';
import type { DownloadProgress } from '../services/ai';

export const useAI = () => {
    const [availability, setAvailability] = useState<'available' | 'downloadable' | 'downloading' | 'unavailable' | 'loading'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const [currentSession, setCurrentSession] = useState<AILanguageModelSession | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        checkAI().then(res => setAvailability(res.available));
    }, []);

    const ensureSession = useCallback(async () => {
        if (!currentSession) {
            console.log('[AI] Creating new session...');
            const params = await LanguageModel.params();
            const initialAvailability = await LanguageModel.availability();

            const session = await LanguageModel.create({
                systemPrompt: "You are a helpful, clear, and concise assistant. Always respond in the language used by the user.",
                temperature: params.defaultTemperature,
                topK: params.defaultTopK,
                monitor(m) {
                    if (initialAvailability === 'downloadable' || initialAvailability === 'downloading') {
                        m.addEventListener('downloadprogress', (e) => {
                            console.log(`[AI Hook] Downloaded ${e.loaded} / ${e.total}`);
                            setDownloadProgress({ loaded: e.loaded, total: e.total });
                        });
                    }
                }
            });

            setCurrentSession(session);
            // After creation, it should be available
            setAvailability('available');
            console.log('[AI] Session created');
            return session;
        }
        return currentSession;
    }, [currentSession]);

    const promptText = useCallback(async (input: string) => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setError(null);
            setDownloadProgress(null);

            const session = await ensureSession();
            const result = await session.prompt(input, { signal: abortControllerRef.current.signal });
            console.log('[AI] Prompt result:', result);
            return result;
        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log('Prompt aborted');
                throw e;
            }
            setError(e.message || 'Unknown error');
            throw e;
        } finally {
            abortControllerRef.current = null;
            setDownloadProgress(null);
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

            const session = await ensureSession();
            const stream = session.promptStreaming(input, { signal: abortControllerRef.current.signal });
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                onChunk(value);
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
            setDownloadProgress(null);
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
