'use client';

import { X } from 'lucide-react';

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
        <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="icon-btn" onClick={onCancel} aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                </div>

                <div className="modal-actions">
                    <button className="btn secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDestructive ? 'destructive' : 'primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
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
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    animation: fadeIn 0.15s ease-out forwards;
                }

                .modal-content.confirmation-modal {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 400px;
                    padding: 24px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
                    transform: scale(0.95);
                    opacity: 0;
                    animation: scaleIn 0.15s ease-out 0.05s forwards;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: white;
                }

                .modal-body {
                    margin-bottom: 24px;
                }

                .modal-body p {
                    margin: 0;
                    color: #a3a3a3;
                    line-height: 1.5;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .btn {
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-size: 0.95rem;
                }

                .btn.secondary {
                    background: #333;
                    color: white;
                }
                .btn.secondary:hover {
                    background: #444;
                }

                .btn.primary {
                    background: #3b82f6;
                    color: white;
                }
                .btn.primary:hover {
                    background: #2563eb;
                }

                .btn.destructive {
                    background: #dc2626;
                    color: white;
                }
                .btn.destructive:hover {
                    background: #b91c1c;
                }

                @keyframes fadeIn {
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
