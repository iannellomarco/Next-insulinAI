'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from '@/lib/translations';

interface ErrorModalProps {
    message: string;
    onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
    const t = useTranslations();
    return (
        <div
            className="error-overlay"
            onClick={onClose}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="error-title"
        >
            <div className="error-modal" onClick={(e) => e.stopPropagation()}>
                <div className="error-icon">
                    <AlertCircle size={28} />
                </div>

                <h3 id="error-title">{t.errors.unableToAnalyze}</h3>
                <p>{message}</p>

                <button className="btn dismiss-btn" onClick={onClose}>
                    {t.errors.gotIt}
                </button>
            </div>

            <style jsx>{`
                .error-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2500;
                    padding: 1.25rem;
                    animation: fadeIn 0.15s ease-out;
                }

                .error-modal {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    width: 100%;
                    max-width: 340px;
                    padding: 1.5rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: slideUp 0.2s ease-out;
                }

                .error-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--destructive);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                }

                h3 {
                    margin: 0 0 0.5rem;
                    font-size: 1.0625rem;
                    font-weight: 600;
                    color: var(--foreground);
                }

                p {
                    margin: 0 0 1.5rem;
                    color: var(--muted-foreground);
                    font-size: 0.9375rem;
                    line-height: 1.5;
                }

                .dismiss-btn {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    font-weight: 500;
                    font-size: 0.9375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    background: var(--secondary);
                    color: var(--foreground);
                }

                .dismiss-btn:hover {
                    background: var(--border);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(12px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
            `}</style>
        </div>
    );
}
