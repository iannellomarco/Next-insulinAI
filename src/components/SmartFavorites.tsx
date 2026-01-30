'use client';

import { Plus, X, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Favorite } from '@/types';

interface SmartFavoritesProps {
    onSelect: (item: Favorite) => void;
    onAddNew: () => void;
}

export default function SmartFavorites({ onSelect, onAddNew }: SmartFavoritesProps) {
    const { favorites, removeFavorite } = useStore();

    const handleRemove = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeFavorite(id);
    };

    return (
        <section className="smart-favorites">
            <h3>Smart Favorites</h3>
            <div className="favorites-scroll">
                {favorites.map((item) => (
                    <button
                        key={item.id}
                        className="quick-eat-card"
                        onClick={() => onSelect(item)}
                    >
                        {item.isAutoSuggested && (
                            <span className="auto-badge" title="AI Suggested">
                                <Sparkles size={12} />
                            </span>
                        )}
                        <button
                            className="remove-btn"
                            onClick={(e) => handleRemove(e, item.id)}
                            aria-label="Remove favorite"
                        >
                            <X size={14} />
                        </button>
                        <span className="card-label">Quick Eat</span>
                        <span className="card-icon">{item.icon}</span>
                        <span className="card-name">{item.name}</span>
                        <span className="card-carbs">{item.carbs}g Carbs</span>
                    </button>
                ))}
                <button className="quick-eat-card add-card" onClick={onAddNew}>
                    <Plus size={32} />
                    <span className="card-name">Add New</span>
                </button>
            </div>
            {favorites.length === 0 && (
                <p className="favorites-hint">
                    Eat the same food 3+ times and it will appear here automatically!
                </p>
            )}
        </section>
    );
}
