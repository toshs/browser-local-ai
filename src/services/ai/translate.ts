import type { AITranslatorCreateOptions, AITranslatorCapabilities, AIMonitor } from "../../types/window-ai";
import type { OnDownloadProgress } from "./index";

export const checkTranslator = async (options: AITranslatorCreateOptions): Promise<AITranslatorCapabilities> => {
    console.log('[Translator Check] Checking Translator...', options);
    if (typeof Translator === 'undefined') {
        console.log('[Translator Check] Translator is undefined');
        return { available: 'no' as const };
    }
    try {
        const available = await Translator.availability(options);
        console.log('[Translator Check] availability:', available);
        return { available };
    } catch (e) {
        console.error('[Translator Check] Error:', e);
        return { available: 'no' as const };
    }
};

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: 'Japanese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'ko', name: 'Korean' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
];

export const translateText = async (
    input: string,
    options: AITranslatorCreateOptions,
    onProgress?: OnDownloadProgress,
) => {
    const status = await checkTranslator(options);
    if (status.available === 'no') {
        throw new Error(`Translation not available for ${options.sourceLanguage} to ${options.targetLanguage}`);
    }

    console.log('[Translator] Creating translator...');
    const translator = await Translator.create({
        ...options,
        monitor(m: AIMonitor) {
            m.addEventListener('downloadprogress', (e) => {
                console.log(`[Translator] Downloaded ${e.loaded} / ${e.total}`);
                onProgress?.({ loaded: e.loaded, total: e.total });
            });
        }
    });

    await translator.ready;

    console.log('[Translator] Translating...');
    const result = await translator.translate(input);
    console.log('[Translator] Result:', result);

    translator.destroy();
    return result;
}
