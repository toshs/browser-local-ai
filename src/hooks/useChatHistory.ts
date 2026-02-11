import { useState, useEffect, useCallback } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

const STORAGE_KEY = 'bla-chat-history';

export const useChatHistory = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Load from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSessions(parsed);
                if (parsed.length > 0) {
                    // Select most recent by default? Or none?
                    // Let's select the first one (most recent usually)
                    setCurrentSessionId(parsed[0].id);
                } else {
                    createNewSession();
                }
            } catch (e) {
                console.error("Failed to parse chat history", e);
                createNewSession();
            }
        } else {
            createNewSession();
        }
    }, []);

    // Save to storage whenever sessions change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const createNewSession = useCallback(() => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        return newSession.id;
    }, []);

    const deleteSession = useCallback((id: string) => {
        setSessions(prev => {
            const next = prev.filter(s => s.id !== id);
            if (next.length === 0) {
                // If we deleted the last one, create a new one immediately
                // This logic needs to be handled carefully to avoid loops, 
                // but createNewSession updates state, so we can't call it inside setState usually without side effects.
                // Better to handle empty state in UI or effect.
                return next;
            }
            return next;
        });

        if (currentSessionId === id) {
            setCurrentSessionId(null); // Or select next available
        }
    }, [currentSessionId]);

    // Perform side effect for empty sessions after delete
    useEffect(() => {
        if (sessions.length === 0 && localStorage.getItem(STORAGE_KEY)) { // Only if we had storage before
            // checking storage key prevents infinite loop on initial load if empty
            // actually initial load handles it. 
            // Logic: If user deletes all, should we create new? Yes.
            // But we need to distinguish "loading" vs "empty".
        }
    }, [sessions]);

    const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
        setSessions(prev => prev.map(session =>
            session.id === id ? { ...session, ...updates, updatedAt: Date.now() } : session
        ));
    }, []);

    const addMessageToSession = useCallback((sessionId: string, message: Message) => {
        setSessions(prev => prev.map(session => {
            if (session.id !== sessionId) return session;

            const newMessages = [...session.messages, message];
            let title = session.title;

            // Auto-generate title from first user message
            if (session.messages.length === 0 && message.role === 'user') {
                title = message.text.slice(0, 30) + (message.text.length > 30 ? '...' : '');
            }

            return {
                ...session,
                title,
                messages: newMessages,
                updatedAt: Date.now()
            };
        }));
    }, []);

    const clearHistory = useCallback(() => {
        setSessions([]);
        localStorage.removeItem(STORAGE_KEY);
        createNewSession();
    }, [createNewSession]);

    return {
        sessions,
        currentSessionId,
        currentSession: sessions.find(s => s.id === currentSessionId) || null,
        createNewSession,
        deleteSession,
        selectSession: setCurrentSessionId,
        addMessageToSession,
        updateSession,
        clearHistory
    };
};
