'use client';

import { Camera, Edit3 } from 'lucide-react';
import { useRef, useMemo, useState, useEffect } from 'react';
import SmartFavorites from './SmartFavorites';
import RecentHistory from './RecentHistory';
import { useStore } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { HistoryItem, Favorite } from '@/types';

interface HomeViewProps {
    onAnalyze: (input: File | string, type: 'image' | 'text') => void;
    onManualEntry: () => void;
    onViewHistory: () => void;
}

// Fallback greeting phrases
const GREETINGS_WITH_NAME = [
    (name: string) => `Hey ${name}, what's on the menu?`,
    (name: string) => `Hi ${name}! Ready to scan?`,
    (name: string) => `Hello ${name}, what are you eating?`,
    (name: string) => `${name}, what's today's meal?`,
    (name: string) => `Hungry, ${name}? Let's log it!`,
];

const GREETINGS_ANONYMOUS = [
    "What are you eating?",
    "Ready to scan your meal?",
    "What's on your plate?",
    "Time to log some food!",
    "Let's count those carbs!",
];



export default function HomeView({ onAnalyze, onManualEntry, onViewHistory }: HomeViewProps) {
    const { history } = useStore();
    const { user, isLoaded } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fallback greeting (stable per session)
    const fallbackGreeting = useMemo(() => {
        if (user) {
            const name = user.firstName || 'Friend';
            const idx = Math.floor(Math.random() * GREETINGS_WITH_NAME.length);
            return GREETINGS_WITH_NAME[idx](name);
        }
        const idx = Math.floor(Math.random() * GREETINGS_ANONYMOUS.length);
        return GREETINGS_ANONYMOUS[idx];
    }, [user]);

    // Use stable local greeting
    const greeting = fallbackGreeting;

    const handleScanClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAnalyze(file, 'image');
        }
    };

    const handleFavoriteSelect = (item: Favorite) => {
        // Quick log: analyze the favorite as text
        onAnalyze(item.name, 'text');
    };

    const handleHistoryItemClick = (item: HistoryItem) => {
        // Could show details or re-analyze
        console.log('Clicked history item:', item);
    };

    return (
        <section id="home-view" className="view home-view">
            {/* Hero + Input Buttons */}
            <div className="home-hero">
                <h2 key={greeting} className="fade-in">{greeting}</h2>
                <input
                    type="file"
                    id="file-input"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <div className="input-buttons">
                    <button className="input-btn" onClick={handleScanClick}>
                        <Camera size={28} />
                        <span>Photo</span>
                    </button>
                    <button className="input-btn" onClick={onManualEntry}>
                        <Edit3 size={28} />
                        <span>Text</span>
                    </button>
                </div>
            </div>

            {/* Smart Favorites */}
            <SmartFavorites
                onSelect={handleFavoriteSelect}
                onAddNew={onManualEntry}
            />

            {/* Recent History */}
            <RecentHistory
                items={history}
                onViewAll={onViewHistory}
                onItemClick={handleHistoryItemClick}
            />
        </section>
    );
}
