'use client';

import { ArrowLeft, Trash2, Plus, Calendar, Utensils } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import GlucoseInputModal from '@/components/GlucoseInputModal';

function getFoodIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apple')) return '🍎';
    if (lowerName.includes('sandwich')) return '🥪';
    if (lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('coffee') || lowerName.includes('latte')) return '☕';
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('oat') || lowerName.includes('cereal')) return '🥣';
    if (lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('pasta')) return '🍝';
    if (lowerName.includes('bread') || lowerName.includes('toast')) return '🍞';
    return '🍽️';
}

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

    // Group history by date
    const groupedHistory = history.reduce((groups, item) => {
        const date = new Date(item.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {} as Record<string, typeof history>);

    return (
        <section id="history-view" className="view">
            <ConfirmationModal
                isOpen={showClearConfirm}
                title="Clear All History?"
                message="This will permanently delete all your meal history. This action cannot be undone."
                confirmText="Delete All"
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
                <button 
                    className="icon-btn" 
                    onClick={onBack}
                    aria-label="Go back"
                >
                    <ArrowLeft size={22} />
                </button>
                <h2>Meal History</h2>
                <button
                    className="icon-btn"
                    aria-label="Clear all history"
                    onClick={() => {
                        if (history.length > 0) setShowClearConfirm(true);
                    }}
                    disabled={history.length === 0}
                    style={{ 
                        opacity: history.length === 0 ? 0.4 : 1,
                        color: history.length > 0 ? 'var(--destructive)' : undefined
                    }}
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div id="history-list" className="history-list">
                {history.length === 0 ? (
                    <div className="empty-history">
                        <div className="empty-icon">
                            <Utensils size={32} strokeWidth={1.5} />
                        </div>
                        <h3>No meals logged yet</h3>
                        <p>Scan or enter your first meal to start tracking</p>
                    </div>
                ) : (
                    Object.entries(groupedHistory).map(([date, items]) => (
                        <div key={date} className="history-group">
                            <div className="history-date">
                                <Calendar size={14} />
                                <span>{date}</span>
                            </div>
                            {items.map((item) => {
                                const foodName = (item.food_items && item.food_items.length > 0) 
                                    ? item.food_items[0].name 
                                    : 'Unknown Food';
                                const isHigh = item.post_glucose && item.post_glucose > settings.highThreshold;
                                const isLow = item.post_glucose && item.post_glucose < settings.lowThreshold;
                                
                                return (
                                    <div key={item.id} className="history-item">
                                        <div className="history-item-icon">
                                            {getFoodIcon(foodName)}
                                        </div>
                                        <div className="history-item-content">
                                            <div className="history-main">
                                                <span className="history-food">{foodName}</span>
                                                <span className="history-dose">{item.suggested_insulin}u</span>
                                            </div>
                                            <div className="history-stats">
                                                <span className="stat-carbs">{item.total_carbs}g carbs</span>
                                                {item.pre_glucose && (
                                                    <span className="stat-pre">
                                                        Pre: {item.pre_glucose}
                                                    </span>
                                                )}
                                                {item.post_glucose ? (
                                                    <span 
                                                        className={`stat-post ${isHigh ? 'high' : ''} ${isLow ? 'low' : ''}`}
                                                    >
                                                        2h: {item.post_glucose}
                                                        {isLow && ' ↓'}
                                                        {isHigh && ' ↑'}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="add-glucose-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setGlucoseModalItem(item.id);
                                                        }}
                                                        aria-label="Add 2-hour glucose check"
                                                    >
                                                        <Plus size={14} />
                                                        <span>Add 2h</span>
                                                    </button>
                                                )}
                                            </div>
                                            <span className="history-time">
                                                {new Date(item.timestamp).toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
