'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export default function TextInputModal({
    onClose,
    onAnalyze
}: {
    onClose: () => void;
    onAnalyze: (text: string) => void;
}) {
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!text.trim()) {
            setError('Please enter a description.');
            return;
        }
        onAnalyze(text);
        onClose();
    };

    return (
        <div id="text-input-modal" className="modal-overlay">
            <div className="modal-content input-modal">
                <div className="modal-header">
                    <h3>Describe Food</h3>
                    <button className="icon-btn close-btn" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                </div>
                <p className="modal-description">Enter a description of what you are eating.</p>

                <div className="textarea-wrapper">
                    <textarea
                        id="food-text-modal-input"
                        placeholder="e.g., 150g of rice with sausage"
                        rows={4}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setError('');
                        }}
                    ></textarea>
                </div>

                {error && <div className="modal-error-message">{error}</div>}

                <div className="modal-actions">
                    <button
                        id="analyze-text-btn"
                        className="btn primary full-width"
                        onClick={handleSubmit}
                    >
                        Analyze Text
                    </button>
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
                    max-width: 400px;
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
                    margin-bottom: 8px;
                }

                h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                    color: white;
                }

                .close-btn {
                    color: #888;
                }
                .close-btn:hover {
                    color: white;
                    background: rgba(255,255,255,0.1);
                }

                .modal-description {
                    font-size: 0.95rem;
                    color: #a3a3a3;
                    margin: 0;
                    line-height: 1.4;
                }

                textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                    color: white;
                    font-size: 1rem;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    transition: all 0.2s;
                    min-height: 120px;
                }

                textarea:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #6366f1; /* Indigo-500 */
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
                }

                textarea::placeholder {
                    color: #525252;
                }

                .modal-error-message {
                    color: #ef4444;
                    font-size: 0.9rem;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 8px 12px;
                    border-radius: 8px;
                    text-align: center;
                }

                .modal-actions {
                    margin-top: 8px;
                }

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
