import { NavLink } from 'react-router-dom';
import { MessageSquare, FileText, Languages } from 'lucide-react';
import './SidePanelLayout.css';

interface SidePanelLayoutProps {
    children: React.ReactNode;
    isWeb?: boolean;
}

export const SidePanelLayout = ({ children, isWeb = false }: SidePanelLayoutProps) => {
    return (
        <div className={`layout-container ${isWeb ? 'web-mode' : ''}`}>
            <header className="layout-header">
                <h1 className="logo-text">Browser Local AI</h1>
            </header>

            {isWeb && (
                <nav className="layout-nav top">
                    <NavLink to="/summarize" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>Summary</span>
                    </NavLink>
                    <NavLink to="/translate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Languages size={20} />
                        <span>Translate</span>
                    </NavLink>
                </nav>
            )}

            <main className="layout-content">
                {children}
            </main>

            {!isWeb && (
                <nav className="layout-nav">
                    <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} />
                        <span>Chat</span>
                    </NavLink>
                    <NavLink to="/summarize" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>Summary</span>
                    </NavLink>
                    <NavLink to="/translate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Languages size={20} />
                        <span>Translate</span>
                    </NavLink>
                </nav>
            )}
        </div>
    );
};
