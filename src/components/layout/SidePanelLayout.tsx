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
            {isWeb && (
                <header className="layout-header">
                    <div className="logo-container">
                        <img src="./icon.png" alt="Browser Local AI Logo" className="logo-icon" />
                        <h1 className="logo-text">Browser Local AI</h1>
                    </div>

                    <nav className="header-nav">
                        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <MessageSquare size={18} />
                            <span>Chat</span>
                        </NavLink>
                        <NavLink to="/summarize" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FileText size={18} />
                            <span>Summary</span>
                        </NavLink>
                        <NavLink to="/translate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Languages size={18} />
                            <span>Translate</span>
                        </NavLink>
                    </nav>
                </header>
            )}

            <main className="layout-content">
                {children}
            </main>

            {/* Bottom Nav for Mobile / Extension only */}
            {!isWeb && (
                <nav className="layout-nav">
                    <NavLink to="/summarize" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <FileText size={20} />
                        <span>Summary</span>
                    </NavLink>
                    <NavLink to="/translate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Languages size={20} />
                        <span>Translate</span>
                    </NavLink>
                    <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} />
                        <span>Chat</span>
                    </NavLink>
                </nav>
            )}

            {/* Mobile-only bottom nav for Web (hidden on desktop via CSS) */}
            {isWeb && (
                <nav className="layout-nav mobile-only">
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
