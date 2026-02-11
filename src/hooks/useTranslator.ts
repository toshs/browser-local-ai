import { useState, useCallback } from 'react';
import { checkTranslator, translateText } from '../services/ai';
import type { AITranslatorCreateOptions } from '../types/window-ai';
import type { DownloadProgress } from '../services/ai';

export const useTranslator = () => {
    const [error, setError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    const checkAvailability = useCallback(async (options: AITranslatorCreateOptions) => {
        return await checkTranslator(options);
    }, []);

    const translate = useCallback(async (input: string, options: AITranslatorCreateOptions) => {
        try {
            setError(null);
            setDownloadProgress(null);
            return await translateText(input, options, (progress) => {
                setDownloadProgress(progress);
            });
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            throw e;
        }
    }, []);

    return { checkAvailability, translate, error, downloadProgress };
};
