'use client';

import { X } from 'lucide-react';

interface ErrorModalProps {
    message: string;
    onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
    return (
        <div className="modal-overlay">
            <div className="modal-content error-modal">
                <div className="modal-header">
                    <h3>Input error</h3>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-error-message">{message}</p>
                </div>

                <button className="btn confirm-btn full-width" onClick={onClose}>
                    Confirm
                </button>
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

                .modal-content.error-modal {
                    background: #121212; /* Dark background */
                    width: 90%;
                    max-width: 400px;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #333;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    animation: scaleUp 0.2s ease-out;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0;
                    color: white;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    color: white;
                }

                .modal-body {
                    text-align: center;
                    padding: 10px 0;
                }

                .modal-error-message {
                    font-size: 1rem;
                    color: #e5e5e5;
                    margin: 0;
                    line-height: 1.5;
                }

                .confirm-btn {
                    background-color: #ef4444; /* Red */
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .confirm-btn:hover {
                    background-color: #dc2626;
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
