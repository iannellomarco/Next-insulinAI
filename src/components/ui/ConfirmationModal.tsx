'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="confirm-overlay" 
            onClick={onCancel}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
        >
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                {isDestructive && (
                    <div className="warning-icon">
                        <AlertTriangle size={24} />
                    </div>
                )}
                
                <h3 id="confirm-title">{title}</h3>
                <p id="confirm-message">{message}</p>

                <div className="confirm-actions">
                    <button className="btn cancel-btn" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn confirm-btn ${isDestructive ? 'destructive' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .confirm-overlay {
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

                .confirm-modal {
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

                .warning-icon {
                    width: 48px;
                    height: 48px;
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

                .confirm-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    font-weight: 500;
                    font-size: 0.9375rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .cancel-btn {
                    background: var(--secondary);
                    color: var(--foreground);
                }

                .cancel-btn:hover {
                    background: var(--border);
                }

                .confirm-btn {
                    background: var(--primary);
                    color: var(--primary-foreground);
                }

                .confirm-btn:hover {
                    opacity: 0.9;
                }

                .confirm-btn.destructive {
                    background: var(--destructive);
                    color: white;
                }

                .confirm-btn.destructive:hover {
                    background: #dc2626;
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
