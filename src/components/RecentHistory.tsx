'use client';

import { ChevronRight, Utensils } from 'lucide-react';
import { HistoryItem } from '@/types';
import { useTranslations, TranslationDict } from '@/lib/translations';

interface RecentHistoryProps {
    items: HistoryItem[];
    onViewAll: () => void;
    onItemClick: (item: HistoryItem) => void;
}

function formatTime(timestamp: number, t: TranslationDict): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const locale = typeof window !== 'undefined' ? navigator.language : 'en-US';
    const time = date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: locale !== 'it-IT' && locale !== 'it'
    });

    if (isToday) {
        return `${t.home.today}, ${time}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `${t.home.yesterday}, ${time}`;
    }

    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + `, ${time}`;
}

function getFoodIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apple')) return '🍎';
    if (lowerName.includes('sandwich')) return '🥪';
    if (lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('coffee') || lowerName.includes('latte') || lowerName.includes('espresso')) return '☕';
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('oat') || lowerName.includes('cereal')) return '🥣';
    if (lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('pasta') || lowerName.includes('spaghetti')) return '🍝';
    if (lowerName.includes('bread') || lowerName.includes('toast')) return '🍞';
    if (lowerName.includes('egg')) return '🥚';
    return '🍽️';
}

export default function RecentHistory({ items, onViewAll, onItemClick }: RecentHistoryProps) {
    const t = useTranslations();
    const recentItems = items.slice(0, 3);

    if (recentItems.length === 0) {
        return (
            <section className="recent-history">
                <div className="section-header">
                    <h3>{t.home.recentMeals}</h3>
                </div>
                <div className="empty-history">
                    <div className="empty-icon">
                        <Utensils size={24} strokeWidth={1.5} />
                    </div>
                    <p>{t.history.noMeals}</p>
                    <span>{t.home.noRecent}</span>
                </div>
            </section>
        );
    }

    return (
        <section className="recent-history">
            <div className="section-header">
                <h3>{t.home.recentMeals}</h3>
                <button onClick={onViewAll} aria-label={t.home.viewAll}>
                    {t.home.viewAll}
                </button>
            </div>
            <div className="recent-list">
                {recentItems.map((item) => {
                    const mainFood = item.food_items?.[0]?.name || item.friendly_description?.split(',')[0] || t.home.logFood;
                    return (
                        <button
                            key={item.id}
                            className="recent-item"
                            onClick={() => onItemClick(item)}
                            aria-label={`${t.general.loading} ${mainFood}`}
                        >
                            <div className="recent-item-icon">
                                {getFoodIcon(mainFood)}
                            </div>
                            <div className="recent-item-info">
                                <span className="recent-item-name">{mainFood}</span>
                                <span className="recent-item-meta">
                                    {formatTime(item.timestamp, t)}
                                    <span className="meta-dot">·</span>
                                    {item.total_carbs}g {t.home.carbsShort}
                                </span>
                            </div>
                            <span className="recent-item-dose">
                                {item.suggested_insulin}{t.home.insulinShort}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
