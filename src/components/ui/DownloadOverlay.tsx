import React from 'react';
import { Download } from 'lucide-react';
import './DownloadOverlay.css';

interface DownloadOverlayProps {
    loaded: number;
    total: number;
}

export const DownloadOverlay: React.FC<DownloadOverlayProps> = ({ loaded, total }) => {
    // Check if valid download progress
    if (total <= 0) return null;

    const progress = Math.round((loaded / total) * 100);

    return (
        <div className="download-notification">
            <div className="download-toast">
                <div className="toast-icon">
                    <Download className="animate-bounce" size={20} />
                </div>
                <div className="toast-content">
                    <h4 className="toast-title">Downloading AI Model</h4>
                    <div className="toast-info">
                        <div className="toast-meta">
                            <span className="toast-note">Initial download (one-time)</span>
                            <span className="toast-percent">{progress}%</span>
                        </div>
                        <div className="toast-progress-track">
                            <div
                                className="toast-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
