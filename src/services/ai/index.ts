import type { AILanguageModelCapabilities, AILanguageModelSession, AIMonitor } from "../../types/window-ai";

export type DownloadProgress = { loaded: number; total: number };
export type OnDownloadProgress = (progress: DownloadProgress) => void;

export const checkAI = async (): Promise<AILanguageModelCapabilities> => {
    console.log('[AI Check] Checking LanguageModel...');
    if (typeof LanguageModel === 'undefined') {
        console.log('[AI Check] LanguageModel is undefined');
        return { available: 'no' as const };
    }
    try {
        const available = await LanguageModel.availability();
        console.log('[AI Check] availability:', available);
        return { available };
    } catch (e) {
        console.error('[AI Check] Error checking availability:', e);
        return { available: 'no' as const };
    }
};

let currentSession: AILanguageModelSession | null = null;

const ensureSession = async (onProgress?: OnDownloadProgress): Promise<AILanguageModelSession> => {
    if (!currentSession) {
        console.log('[AI] Creating new session...');
        currentSession = await LanguageModel.create({
            monitor(m: AIMonitor) {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`[AI] Downloaded ${e.loaded} / ${e.total}`);
                    onProgress?.({ loaded: e.loaded, total: e.total });
                });
            }
        });
        console.log('[AI] Session created');
    }
    return currentSession;
};

export const generateText = async (
    prompt: string,
    onProgress?: OnDownloadProgress,
): Promise<string> => {
    const status = await checkAI();
    if (status.available === 'no') {
        throw new Error("AI model is not available on this browser.");
    }

    try {
        const session = await ensureSession(onProgress);
        const result = await session.prompt(prompt);
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
): AsyncGenerator<string> {
    const status = await checkAI();
    if (status.available === 'no') {
        throw new Error("AI model is not available on this browser.");
    }

    try {
        const session = await ensureSession(onProgress);
        const stream = session.promptStreaming(prompt);
        const reader = stream.getReader();

        let previousText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // promptStreaming returns accumulated text, so extract the new chunk
            const newChunk = value.slice(previousText.length);
            previousText = value;
            if (newChunk) {
                yield newChunk;
            }
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
