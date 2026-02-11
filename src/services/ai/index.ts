import type { AILanguageModelCapabilities, AILanguageModelSession, AIMonitor } from "../../types/window-ai";

export type DownloadProgress = { loaded: number; total: number };
export type OnDownloadProgress = (progress: DownloadProgress) => void;

export const checkAI = async (): Promise<AILanguageModelCapabilities> => {
    console.log('[AI Check] Checking LanguageModel...');
    if (typeof LanguageModel === 'undefined') {
        console.log('[AI Check] LanguageModel is undefined');
        return { available: 'unavailable' };
    }
    try {
        const available = await LanguageModel.availability();
        console.log('[AI Check] availability:', available);
        return { available };
    } catch (e) {
        console.error('[AI Check] Error checking availability:', e);
        return { available: 'unavailable' };
    }
};

let currentSession: AILanguageModelSession | null = null;

const ensureSession = async (onProgress?: OnDownloadProgress): Promise<AILanguageModelSession> => {
    if (!currentSession) {
        console.log('[AI] Creating new session...');
        // Lower temperature and topK for much more stable and coherent output.
        // temperature: 0 makes it deterministic (focused), topK: 1 picks the most likely word.
        const params = await LanguageModel.params();
        const availability = await LanguageModel.availability();

        currentSession = await LanguageModel.create({
            systemPrompt: "You are a helpful, clear, and concise assistant. Always respond in the language used by the user.",
            temperature: params.defaultTemperature,
            topK: params.defaultTopK,
            monitor(m: AIMonitor) {
                if (availability === 'downloadable' || availability === 'downloading') {
                    m.addEventListener('downloadprogress', (e) => {
                        console.log(`[AI] Downloaded ${e.loaded} / ${e.total}`);
                        onProgress?.({ loaded: e.loaded, total: e.total });
                    });
                }
            }
        });
        console.log('[AI] Session created');
    }
    return currentSession;
};

export const generateText = async (
    prompt: string,
    onProgress?: OnDownloadProgress,
    signal?: AbortSignal,
): Promise<string> => {
    const status = await checkAI();
    if (status.available === 'unavailable') {
        throw new Error("AI model is not available on this browser.");
    }

    try {
        const session = await ensureSession(onProgress);
        const result = await session.prompt(prompt, { signal });
        console.log('[AI] Prompt result:', result);
        return result;
    } catch (e) {
        console.error('[AI] Prompt failed:', e);
        currentSession = null;
        throw e;
    }
};

export const generateTextStream = async function* (
    prompt: string,
    onProgress?: OnDownloadProgress,
    signal?: AbortSignal,
): AsyncGenerator<string> {
    const status = await checkAI();
    if (status.available === 'unavailable') {
        throw new Error("AI model is not available on this browser.");
    }

    try {
        const session = await ensureSession(onProgress);
        const stream = session.promptStreaming(prompt, { signal });
        const reader = stream.getReader();

        let previousText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log('[AI] Stream chunk:', value);
            // promptStreaming returns accumulated text, so extract the new chunk
            yield value;
        }
    } catch (e) {
        console.error('[AI] Stream failed:', e);
        currentSession = null;
        throw e;
    }
};

export const createSession = async () => {
    throw new Error("Deprecated: Use generateText directly which manages session");
}

export const promptAI = generateText;

export * from './summarize';
export * from './translate';
export * from './detect';
