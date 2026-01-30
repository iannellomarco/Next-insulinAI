'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span>{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="toast-close">
                        <X size={16} />
                    </button>
                </div>
            ))}
            <style jsx>{`
                .toast-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: none;
                }
                .toast {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    min-width: 300px;
                    max-width: 400px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    background: white;
                    color: #1a1a1a;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    animation: slideIn 0.3s ease-out;
                    font-size: 14px;
                    font-weight: 500;
                    border-left: 4px solid #3b82f6; 
                }
                .toast-error {
                    border-left-color: #ef4444;
                    background: #fef2f2;
                    color: #991b1b;
                }
                .toast-success {
                    border-left-color: #22c55e;
                    background: #f0fdf4;
                    color: #166534;
                }
                .toast-close {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: inherit;
                    opacity: 0.7;
                    display: flex;
                    align-items: center;
                }
                .toast-close:hover {
                    opacity: 1;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: ToastType = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastMessage = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
