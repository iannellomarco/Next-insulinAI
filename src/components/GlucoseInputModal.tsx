'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface GlucoseInputModalProps {
    onClose: () => void;
    onSave: (value: number) => void;
}

export default function GlucoseInputModal({ onClose, onSave }: GlucoseInputModalProps) {
    const [glucose, setGlucose] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const val = parseInt(glucose);
        if (isNaN(val) || val <= 0 || val > 600) {
            setError('Please enter a valid glucose level (1-600).');
            return;
        }
        onSave(val);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content input-modal">
                <div className="modal-header">
                    <h3>2h Check</h3>
                    <button className="icon-btn close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <p className="modal-description">
                    Enter your blood glucose 2 hours after the meal.
                </p>

                <div className="input-group">
                    <input
                        type="number"
                        placeholder="e.g. 140"
                        value={glucose}
                        onChange={(e) => {
                            setGlucose(e.target.value);
                            setError('');
                        }}
                        autoFocus
                    />
                    <span className="unit">mg/dL</span>
                </div>

                {error && <div className="modal-error-message">{error}</div>}

                <div className="modal-actions">
                    <button className="btn secondary" onClick={onClose}>Cancel</button>
                    <button className="btn primary" onClick={handleSubmit}>Save</button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                    animation: fadeIn 0.2s ease-out;
                }

                .modal-content.input-modal {
                    background: #121212;
                    width: 90%;
                    max-width: 320px;
                    border-radius: 16px;
                    padding: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    animation: scaleUp 0.2s ease-out;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: white;
                }

                .close-btn {
                    color: #888;
                    background: transparent;
                    border: none;
                }
                .close-btn:hover {
                    color: white;
                }

                .modal-description {
                    font-size: 0.9rem;
                    color: #a3a3a3;
                    margin: 0;
                }

                .input-group {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                    color: white;
                    font-size: 1.5rem;
                    text-align: center;
                    font-weight: 600;
                    width: 100%;
                    outline: none;
                }

                input:focus {
                    border-color: #6366f1;
                    background: rgba(255, 255, 255, 0.08);
                }

                .unit {
                    text-align: center;
                    color: #737373;
                    font-size: 0.8rem;
                }

                .modal-error-message {
                    color: #ef4444;
                    font-size: 0.85rem;
                    text-align: center;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 8px;
                }

                .btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn.primary {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    color: white;
                }
                .btn.primary:hover { opacity: 0.9; }

                .btn.secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                .btn.secondary:hover { background: rgba(255, 255, 255, 0.15); }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
