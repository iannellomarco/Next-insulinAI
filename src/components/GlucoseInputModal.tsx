'use client';

import { Activity } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '@/lib/translations';

interface GlucoseInputModalProps {
    onClose: () => void;
    onSave: (value: number) => void;
}

export default function GlucoseInputModal({ onClose, onSave }: GlucoseInputModalProps) {
    const t = useTranslations();
    const [glucose, setGlucose] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const val = parseInt(glucose);
        if (isNaN(val) || val <= 0 || val > 600) {
            setError(t.history.glucoseInvalid);
            return;
        }
        onSave(val);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div
            className="glucose-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="glucose-title"
        >
            <div className="glucose-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-icon">
                    <Activity size={22} />
                </div>

                <h3 id="glucose-title">{t.history.glucoseCheck}</h3>
                <p>{t.history.glucoseCheckSub}</p>

                <div className="input-wrapper">
                    <input
                        type="number"
                        placeholder={t.history.glucosePlaceholder}
                        value={glucose}
                        onChange={(e) => {
                            setGlucose(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        aria-label={t.history.glucoseAria}
                    />
                    <span className="unit-label">{t.history.glucoseUnit}</span>
                </div>

                {error && (
                    <div className="input-error" role="alert">
                        {error}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn cancel-btn" onClick={onClose}>
                        {t.general.cancel}
                    </button>
                    <button
                        className="btn save-btn"
                        onClick={handleSubmit}
                        disabled={!glucose}
                    >
                        {t.general.save}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .glucose-overlay {
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

                .glucose-modal {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    width: 100%;
                    max-width: 320px;
                    padding: 1.5rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: slideUp 0.2s ease-out;
                }

                .modal-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                }

                h3 {
                    margin: 0 0 0.375rem;
                    font-size: 1.0625rem;
                    font-weight: 600;
                    color: var(--foreground);
                }

                p {
                    margin: 0 0 1.25rem;
                    color: var(--muted-foreground);
                    font-size: 0.875rem;
                    line-height: 1.4;
                }

                .input-wrapper {
                    margin-bottom: 1rem;
                }

                input {
                    width: 100%;
                    background: var(--secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 1rem;
                    color: var(--foreground);
                    font-size: 1.5rem;
                    text-align: center;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.2s;
                }

                input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
                }

                input::placeholder {
                    color: var(--muted-foreground);
                    font-weight: 400;
                }

                .unit-label {
                    display: block;
                    text-align: center;
                    color: var(--muted-foreground);
                    font-size: 0.75rem;
                    margin-top: 0.375rem;
                }

                .input-error {
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: var(--destructive);
                    padding: 0.5rem 0.75rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.8rem;
                    margin-bottom: 1rem;
                }

                .modal-actions {
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

                .save-btn {
                    background: var(--primary);
                    color: var(--primary-foreground);
                }

                .save-btn:hover {
                    opacity: 0.9;
                }

                .save-btn:disabled {
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
