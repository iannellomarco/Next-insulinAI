'use client';

import { HistoryItem } from '@/types';

interface RecentHistoryProps {
    items: HistoryItem[];
    onViewAll: () => void;
    onItemClick: (item: HistoryItem) => void;
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    if (isToday) {
        return `Today, ${time}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${time}`;
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

function getFoodIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apple')) return '🍎';
    if (lowerName.includes('sandwich')) return '🥪';
    if (lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('coffee') || lowerName.includes('espresso')) return '☕';
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('oat')) return '🥣';
    return '🍽️';
}

export default function RecentHistory({ items, onViewAll, onItemClick }: RecentHistoryProps) {
    const recentItems = items.slice(0, 3);

    if (recentItems.length === 0) {
        return (
            <section className="recent-history">
                <h3>Recent History</h3>
                <p className="empty-state">No meals logged yet. Scan your first food!</p>
            </section>
        );
    }

    return (
        <section className="recent-history">
            <h3>Recent History</h3>
            <div className="recent-list">
                {recentItems.map((item) => {
                    const mainFood = item.food_items?.[0]?.name || item.friendly_description?.split(',')[0] || 'Food';
                    return (
                        <button
                            key={item.id}
                            className="recent-item"
                            onClick={() => onItemClick(item)}
                        >
                            <span className="item-icon">{getFoodIcon(mainFood)}</span>
                            <span className="item-name">{mainFood}</span>
                            <div className="item-meta">
                                <span className="item-time">{formatTime(item.timestamp)}</span>
                                <span className="item-carbs">{item.total_carbs}g Carbs</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            <button className="view-all-link" onClick={onViewAll}>
                View All
            </button>
        </section>
    );
}
