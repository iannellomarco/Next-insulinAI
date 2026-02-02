'use client';

import { X, Utensils } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '@/lib/translations';

export default function TextInputModal({
    onClose,
    onAnalyze
}: {
    onClose: () => void;
    onAnalyze: (text: string) => void;
}) {
    const t = useTranslations();
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!text.trim()) {
            setError(t.textInput.error);
            return;
        }
        onAnalyze(text);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="text-input-title"
        >
            <div
                className="text-input-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header-row">
                    <div className="modal-icon">
                        <Utensils size={20} />
                    </div>
                    <div className="modal-title-section">
                        <h3 id="text-input-title">{t.textInput.title}</h3>
                        <p>{t.textInput.subtitle}</p>
                    </div>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label={t.general.close}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="textarea-container">
                    <textarea
                        id="food-text-input"
                        placeholder={t.textInput.placeholder}
                        rows={4}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <span className="char-count">{text.length}/500</span>
                </div>

                {error && (
                    <div className="input-error" role="alert">
                        {error}
                    </div>
                )}

                <div className="modal-actions-row">
                    <button
                        className="btn secondary"
                        onClick={onClose}
                    >
                        {t.general.cancel}
                    </button>
                    <button
                        className="btn primary"
                        onClick={handleSubmit}
                        disabled={!text.trim()}
                    >
                        {t.textInput.analyze}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 1.25rem;
                    animation: fadeIn 0.2s ease-out;
                }

                .text-input-modal {
                    background: var(--card);
                    width: 100%;
                    max-width: 400px;
                    border-radius: var(--radius-xl);
                    padding: 1.5rem;
                    border: 1px solid var(--border);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: slideUp 0.3s ease-out;
                }

                .modal-header-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.875rem;
                    margin-bottom: 1.25rem;
                }

                .modal-icon {
                    width: 40px;
                    height: 40px;
                    flex-shrink: 0;
                    border-radius: var(--radius-md);
                    background: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                }

                .modal-title-section {
                    flex: 1;
                }

                .modal-title-section h3 {
                    font-size: 1.0625rem;
                    font-weight: 600;
                    color: var(--foreground);
                    margin: 0 0 0.125rem;
                }

                .modal-title-section p {
                    font-size: 0.8125rem;
                    color: var(--muted-foreground);
                    margin: 0;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    padding: 0.375rem;
                    border-radius: var(--radius-sm);
                    color: var(--muted-foreground);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: var(--secondary);
                    color: var(--foreground);
                }

                .textarea-container {
                    position: relative;
                    margin-bottom: 1rem;
                }

                textarea {
                    width: 100%;
                    background: var(--secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 0.875rem;
                    color: var(--foreground);
                    font-size: 0.9375rem;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    transition: all 0.2s;
                    min-height: 120px;
                    line-height: 1.5;
                }

                textarea:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
                }

                textarea::placeholder {
                    color: var(--muted-foreground);
                }

                .char-count {
                    position: absolute;
                    bottom: 0.625rem;
                    right: 0.75rem;
                    font-size: 0.7rem;
                    color: var(--muted-foreground);
                }

                .input-error {
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: var(--destructive);
                    padding: 0.625rem 0.875rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.8125rem;
                    margin-bottom: 1rem;
                }

                .modal-actions-row {
                    display: flex;
                    gap: 0.75rem;
                }

                .modal-actions-row .btn {
                    flex: 1;
                }

                .modal-actions-row .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(16px); 
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
