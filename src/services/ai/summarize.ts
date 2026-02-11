import type { AISummarizerCapabilities, AISummarizerCreateOptions, AIMonitor } from "../../types/window-ai";
import type { OnDownloadProgress } from "./index";

export const checkSummarizer = async (): Promise<AISummarizerCapabilities> => {
    console.log('[Summarizer Check] Checking Summarizer...');
    if (typeof Summarizer === 'undefined') {
        console.log('[Summarizer Check] Summarizer is undefined');
        return { available: 'no' as const };
    }
    try {
        const available = await Summarizer.availability();
        console.log('[Summarizer Check] availability:', available);
        return { available };
    } catch (e) {
        console.error('[Summarizer Check] Error:', e);
        return { available: 'no' as const };
    }
};

export const summarizeText = async (
    input: string,
    options?: AISummarizerCreateOptions,
    onProgress?: OnDownloadProgress,
) => {
    const status = await checkSummarizer();
    if (status.available === 'no') {
        throw new Error('Summarizer API not available');
    }

    console.log('[Summarizer] Creating summarizer with options:', options);
    const summarizer = await Summarizer.create({
        ...options,
        monitor(m: AIMonitor) {
            m.addEventListener('downloadprogress', (e) => {
                console.log(`[Summarizer] Downloaded ${e.loaded} / ${e.total}`);
                onProgress?.({ loaded: e.loaded, total: e.total });
            });
        }
    });

    await summarizer.ready;

    console.log('[Summarizer] Summarizing...');
    const result = await summarizer.summarize(input);
    console.log('[Summarizer] Result:', result);

    summarizer.destroy();
    return result;
}
