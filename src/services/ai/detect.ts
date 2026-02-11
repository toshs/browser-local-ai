import type { AILanguageDetectorSession, AIMonitor, LanguageDetectionResult } from "../../types/window-ai";
import type { OnDownloadProgress } from "./index";

let detector: AILanguageDetectorSession | null = null;

export const checkLanguageDetector = async (): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'> => {
    if (typeof LanguageDetector === 'undefined') {
        return 'unavailable';
    }
    try {
        return await LanguageDetector.availability();
    } catch {
        return 'unavailable';
    }
};

export const detectLanguage = async (
    text: string,
    onProgress?: OnDownloadProgress,
): Promise<LanguageDetectionResult[]> => {
    if (typeof LanguageDetector === 'undefined') {
        throw new Error('LanguageDetector API not available');
    }

    if (!detector) {
        detector = await LanguageDetector.create({
            monitor(m: AIMonitor) {
                m.addEventListener('downloadprogress', (e) => {
                    console.log(`[LanguageDetector] Downloaded ${e.loaded} / ${e.total}`);
                    onProgress?.({ loaded: e.loaded, total: e.total });
                });
            }
        });
    }

    return await detector.detect(text);
};
