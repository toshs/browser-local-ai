// Chrome Built-in AI: LanguageModel, Summarizer, Translator, LanguageDetector globals

export interface AILanguageModelCapabilities {
    available: 'available' | 'downloadable' | 'downloading' | 'unavailable';
    defaultTopK?: number;
    maxTopK?: number;
    defaultTemperature?: number;
}

export interface AILanguageModelCreateOptions {
    signal?: AbortSignal;
    systemPrompt?: string;
    initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[];
    topK?: number;
    temperature?: number;
    monitor?: (monitor: AIMonitor) => void;
}

export interface AIMonitor {
    addEventListener(type: 'downloadprogress', listener: (e: { loaded: number; total: number }) => void): void;
}

export interface AILanguageModelSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    promptStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
    clone(): Promise<AILanguageModelSession>;
    destroy(): void;
    countPromptTokens(input: string): Promise<number>;
    maxTokens: number;
    tokensSoFar: number;
    tokensLeft: number;
    topK: number;
    temperature: number;
}

export interface AISummarizerCapabilities {
    available: 'available' | 'downloadable' | 'downloading' | 'unavailable';
}

export interface AISummarizerCreateOptions {
    sharedContext?: string;
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    monitor?: (monitor: AIMonitor) => void;
    signal?: AbortSignal;
    expectedLanguage?: string;
}

export interface AISummarizerSession {
    summarize(input: string, options?: { context?: string }): Promise<string>;
    summarizeStreaming(input: string, options?: { context?: string }): ReadableStream<string>;
    destroy(): void;
    ready: Promise<void>;
}

export interface AITranslatorCapabilities {
    available: 'available' | 'downloadable' | 'downloading' | 'unavailable';
}

export interface AITranslatorCreateOptions {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: AIMonitor) => void;
    signal?: AbortSignal;
}

export interface AITranslatorSession {
    translate(input: string): Promise<string>;
    translateStreaming(input: string): ReadableStream<string>;
    destroy(): void;
    ready: Promise<void>;
}

export interface LanguageDetectionResult {
    detectedLanguage: string;
    confidence: number;
}

export interface AILanguageDetectorSession {
    detect(input: string): Promise<LanguageDetectionResult[]>;
    destroy(): void;
    ready: Promise<void>;
}

// Global API declarations
declare global {
    const LanguageModel: {
        availability(options?: Record<string, unknown>): Promise<AILanguageModelCapabilities['available']>;
        create(options?: AILanguageModelCreateOptions): Promise<AILanguageModelSession>;
        params(): Promise<{ defaultTopK: number; maxTopK: number; defaultTemperature: number; maxTemperature: number }>;
    };

    const Summarizer: {
        availability(): Promise<AISummarizerCapabilities['available']>;
        create(options?: AISummarizerCreateOptions): Promise<AISummarizerSession>;
    };

    const Translator: {
        availability(options: AITranslatorCreateOptions): Promise<AITranslatorCapabilities['available']>;
        create(options?: AITranslatorCreateOptions): Promise<AITranslatorSession>;
    };

    const LanguageDetector: {
        availability(): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
        create(options?: { monitor?: (monitor: AIMonitor) => void }): Promise<AILanguageDetectorSession>;
    };
}
