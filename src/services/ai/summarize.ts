import type { AISummarizerCapabilities, AISummarizerCreateOptions, AIMonitor } from "../../types/window-ai";
import type { OnDownloadProgress } from "./index";

export const checkSummarizer = async (): Promise<AISummarizerCapabilities> => {
    console.log('[Summarizer Check] Checking Summarizer...');
    if (typeof Summarizer === 'undefined') {
        console.log('[Summarizer Check] Summarizer is undefined');
        return { available: 'unavailable' };
    }
    try {
        const available = await Summarizer.availability();
        console.log('[Summarizer Check] availability:', available);
        return { available };
    } catch (e) {
        console.error('[Summarizer Check] Error:', e);
        return { available: 'unavailable' };
    }
};


export const summarizeText = async (
    input: string,
    options?: AISummarizerCreateOptions,
    onProgress?: OnDownloadProgress,
    runOptions?: { context?: string },
) => {
    const status = await checkSummarizer();
    if (status.available === 'unavailable') {
        throw new Error('Summarizer API not available');
    }

    console.log('[Summarizer] Creating summarizer with options:', options);
    const summarizer = await Summarizer.create({
        ...options,
        monitor(m: AIMonitor) {
            // Only attach listener if download is actually needed
            if (status.available === 'downloadable' || status.available === 'downloading') {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`[Summarizer] Downloaded ${e.loaded} / ${e.total}`);
                    onProgress?.({ loaded: e.loaded, total: e.total });
                });
            }
        }
    });

    await summarizer.ready;

    console.log('[Summarizer] Summarizing...');
    const result = await summarizer.summarize(input, runOptions);
    console.log('[Summarizer] Result:', result);

    summarizer.destroy();
    return result;
}

export const summarizeTextStreaming = async function* (
    input: string,
    options?: AISummarizerCreateOptions,
    onProgress?: OnDownloadProgress,
    runOptions?: { context?: string },
): AsyncGenerator<string> {
    const status = await checkSummarizer();
    if (status.available === 'unavailable') {
        throw new Error('Summarizer API not available');
    }

    console.log('[Summarizer] Creating summarizer (streaming) with options:', options);
    const summarizer = await Summarizer.create({
        ...options,
        monitor(m: AIMonitor) {
            if (status.available === 'downloadable' || status.available === 'downloading') {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`[Summarizer] Downloaded ${e.loaded} / ${e.total}`);
                    onProgress?.({ loaded: e.loaded, total: e.total });
                });
            }
        }
    });

    await summarizer.ready;

    console.log('[Summarizer] Summarizing streaming...');
    const stream = summarizer.summarizeStreaming(input, runOptions);
    const reader = stream.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (value) {
                yield value;
            }
            if (done) break;
        }
    } finally {
        reader.releaseLock();
        summarizer.destroy();
    }
}

