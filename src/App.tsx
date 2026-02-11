import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SidePanelLayout } from './components/layout/SidePanelLayout';
import { ChatInterface } from './components/features/Chat/ChatInterface';
import { SummarizerInterface } from './components/features/Summarizer/SummarizerInterface';
import { TranslatorInterface } from './components/features/Translator/TranslatorInterface';
import './App.css';

interface InitialData {
  text?: string;
  timestamp?: number; // Force re-render/update on same action
}

// Component to handle Chrome messages and navigation
const ContextHandler = () => {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  useEffect(() => {
    const handleAction = (action: any) => {
      if (action.action === 'bla-translate-selection') {
        setInitialData({ text: action.selectionText, timestamp: Date.now() });
        navigate('/translate');
      } else if (action.action === 'bla-summarize-page') {
        setInitialData({ text: action.selectionText, timestamp: Date.now() });
        navigate('/summarize');
      } else if (action.action === 'bla-explain-code') {
        setInitialData({ text: "Explain this code:\n" + action.selectionText, timestamp: Date.now() });
        navigate('/chat');
      }
    };

    // Safe check for Chrome extension APIs
    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.storage && !!chrome.contextMenus;

    if (isExtension && chrome.storage?.local) {
      chrome.storage.local.get(['pendingAction'], (result) => {
        if (result.pendingAction) {
          handleAction(result.pendingAction);
          chrome.storage.local.remove('pendingAction');
        }
      });
    }

    const listener = (message: any) => {
      if (message.type === 'CONTEXT_ACTION') {
        handleAction(message);
      }
    };

    if (isExtension && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
    }
    return () => {
      if (isExtension && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    };
  }, [navigate]);

  // Pass initialData to child routes via Outlet context or props? 
  // For now, mirroring Routes here since we need to pass props.
  // Ideally ContextHandler should wrap Routes, but we need to render Routes to use useNavigate?
  // Actually, we can just use a component inside Router.

  return (
    <Routes>
      <Route path="/chat" element={<ChatInterface initialInput={initialData?.text} key={initialData?.timestamp} />} />
      <Route path="/summarize" element={<SummarizerInterface initialInput={initialData?.text} key={initialData?.timestamp} />} />
      <Route path="/translate" element={<TranslatorInterface initialInput={initialData?.text} key={initialData?.timestamp} />} />
    </Routes>
  );
}

function App() {
  // Safe check for Chrome extension APIs
  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.storage && !!chrome.contextMenus;
  const isWeb = !isExtension;
  // const isDesktop = useMediaQuery('(min-width: 768px)'); // Used in child components now

  return (
    <HashRouter>
      <SidePanelLayout isWeb={isWeb}>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
        <ContextHandler />
      </SidePanelLayout>
    </HashRouter>
  );
}

export default App;
