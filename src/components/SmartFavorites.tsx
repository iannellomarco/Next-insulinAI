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
            <h3>Quick Favorites</h3>
            <div className="favorites-scroll">
                {favorites.map((item) => (
                    <button
                        key={item.id}
                        className="quick-eat-card"
                        onClick={() => onSelect(item)}
                        aria-label={`Quick log ${item.name}`}
                    >
                        {item.isAutoSuggested && (
                            <span className="auto-badge" title="AI Suggested">
                                <Sparkles size={12} />
                            </span>
                        )}
                        <button
                            className="remove-btn"
                            onClick={(e) => handleRemove(e, item.id)}
                            aria-label={`Remove ${item.name} from favorites`}
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
                    aria-label="Add new favorite food"
                >
                    <Plus size={28} strokeWidth={1.5} />
                    <span className="card-name">Add New</span>
                </button>
            </div>
            {favorites.length === 0 && (
                <p className="favorites-hint">
                    Log a food 3+ times and it will appear here automatically
                </p>
            )}
        </section>
    );
}
