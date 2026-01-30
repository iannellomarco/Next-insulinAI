'use client';

import { ArrowLeft, Trash2, PlusCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import GlucoseInputModal from '@/components/GlucoseInputModal';

export default function HistoryView({ onBack }: { onBack: () => void }) {
    const { history, settings, clearHistory, updateHistoryItem } = useStore();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [glucoseModalItem, setGlucoseModalItem] = useState<string | null>(null);

    const handleClearConfirm = () => {
        clearHistory();
        setShowClearConfirm(false);
    };

    const handleSaveGlucose = (value: number) => {
        if (glucoseModalItem) {
            updateHistoryItem(glucoseModalItem, { post_glucose: value });
            setGlucoseModalItem(null);
        }
    };

    return (
        <section id="history-view" className="view">
            <ConfirmationModal
                isOpen={showClearConfirm}
                title="Clear History?"
                message="Are you sure you want to delete all history? This cannot be undone."
                confirmText="Confirm"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={handleClearConfirm}
                onCancel={() => setShowClearConfirm(false)}
            />

            {glucoseModalItem && (
                <GlucoseInputModal
                    onClose={() => setGlucoseModalItem(null)}
                    onSave={handleSaveGlucose}
                />
            )}

            <div className="view-header">
                <button id="home-from-history-btn" className="icon-btn" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <h2>History</h2>
                <button
                    className="icon-btn"
                    aria-label="Clear History"
                    style={{ color: 'var(--danger-color)' }}
                    onClick={() => {
                        if (history.length > 0) setShowClearConfirm(true);
                    }}
                >
                    <Trash2 size={24} />
                </button>
            </div>

            <div id="history-list" className="history-list">
                {history.length === 0 && (
                    <p style={{ textAlign: 'center', marginTop: '40px' }}>No history yet.</p>
                )}
                {history.map((item) => (
                    <div key={item.id} className="history-item">
                        <div className="history-header">
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="history-main">
                            <span className="history-food">{(item.food_items && item.food_items.length > 0) ? item.food_items[0].name : 'Unknown Food'}</span>
                            <span className="history-dose">{item.suggested_insulin}u</span>
                        </div>
                        <div className="history-stats">
                            <span>{item.total_carbs}g Carbs</span>
                            {item.post_glucose ? (
                                <span className={`stat-glucose`} style={{
                                    color: (item.post_glucose > settings.highThreshold || item.post_glucose < settings.lowThreshold)
                                        ? '#ef4444' // Red
                                        : '#22c55e', // Green
                                    fontWeight: 600,
                                    marginLeft: 'auto'
                                }}>
                                    {item.post_glucose} mg/dL
                                    {(item.post_glucose < settings.lowThreshold) && ' 📉'}
                                    {(item.post_glucose > settings.highThreshold) && ' 📈'}
                                </span>
                            ) : (
                                <button
                                    className="add-glucose-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setGlucoseModalItem(item.id);
                                    }}
                                >
                                    <PlusCircle size={14} />
                                    Add 2h Check
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .add-glucose-btn {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(99, 102, 241, 0.15);
                    color: #818cf8;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .add-glucose-btn:hover {
                    background: rgba(99, 102, 241, 0.25);
                    color: #a5b4fc;
                }
            `}</style>
        </section>
    );
}
