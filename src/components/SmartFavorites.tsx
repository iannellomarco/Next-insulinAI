'use client';

import { Plus, X, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Favorite } from '@/types';
import { useTranslations } from '@/lib/translations';

interface SmartFavoritesProps {
    onSelect: (item: Favorite) => void;
    onAddNew: () => void;
}

export default function SmartFavorites({ onSelect, onAddNew }: SmartFavoritesProps) {
    const { favorites, removeFavorite } = useStore();
    const t = useTranslations();

    const handleRemove = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeFavorite(id);
    };

    return (
        <section className="smart-favorites">
            <h3>{t.home.quickFavorites}</h3>
            <div className="favorites-scroll">
                {favorites.map((item) => (
                    <button
                        key={item.id}
                        className="quick-eat-card"
                        onClick={() => onSelect(item)}
                        aria-label={`${t.general.loading} ${item.name}`} // Reusing loading for action prefix or just use item.name
                    >
                        {item.isAutoSuggested && (
                            <span className="auto-badge" title="AI Suggested">
                                <Sparkles size={12} />
                            </span>
                        )}
                        <button
                            className="remove-btn"
                            onClick={(e) => handleRemove(e, item.id)}
                            aria-label={`Remove ${item.name}`}
                        >
                            <X size={14} />
                        </button>
                        <span className="card-icon" aria-hidden="true">{item.icon}</span>
                        <span className="card-name">{item.name}</span>
                        <span className="card-carbs">{item.carbs}g</span>
                    </button>
                ))}
                <button
                    className="quick-eat-card add-card"
                    onClick={onAddNew}
                    aria-label={t.home.addNew}
                >
                    <Plus size={28} strokeWidth={1.5} />
                    <span className="card-name">{t.home.addNew}</span>
                </button>
            </div>
            {favorites.length === 0 && (
                <p className="favorites-hint">
                    {t.home.favoritesHint}
                </p>
            )}
        </section>
    );
}
