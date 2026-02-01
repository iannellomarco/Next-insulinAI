'use client';

import { Camera, PenLine, ChevronRight } from 'lucide-react';
import { useRef, useMemo } from 'react';
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

const GREETINGS_WITH_NAME = [
    (name: string) => `Hey ${name}, what's on the menu?`,
    (name: string) => `Hi ${name}! Ready to scan?`,
    (name: string) => `Hello ${name}, what are you eating?`,
    (name: string) => `${name}, what's for today?`,
];

const GREETINGS_ANONYMOUS = [
    "What are you eating?",
    "Ready to scan your meal?",
    "What's on your plate?",
    "Let's count those carbs!",
];

export default function HomeView({ onAnalyze, onManualEntry, onViewHistory }: HomeViewProps) {
    const { history } = useStore();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const greeting = useMemo(() => {
        if (user) {
            const name = user.firstName || 'there';
            const idx = Math.floor(Math.random() * GREETINGS_WITH_NAME.length);
            return GREETINGS_WITH_NAME[idx](name);
        }
        const idx = Math.floor(Math.random() * GREETINGS_ANONYMOUS.length);
        return GREETINGS_ANONYMOUS[idx];
    }, [user]);

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
        onAnalyze(item.name, 'text');
    };

    const handleHistoryItemClick = (item: HistoryItem) => {
        console.log('Clicked history item:', item);
    };

    return (
        <section id="home-view" className="view home-view">
            {/* Hero Section */}
            <div className="home-hero">
                <h2 key={greeting} className="fade-in text-balance">
                    {greeting}
                </h2>
                
                <input
                    type="file"
                    id="file-input"
                    accept="image/*"
                    capture="environment"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                
                <div className="input-buttons">
                    <button 
                        className="input-btn" 
                        onClick={handleScanClick}
                        aria-label="Take a photo of your food"
                    >
                        <Camera size={26} strokeWidth={1.5} />
                        <span>Photo</span>
                    </button>
                    <button 
                        className="input-btn" 
                        onClick={onManualEntry}
                        aria-label="Enter food manually"
                    >
                        <PenLine size={26} strokeWidth={1.5} />
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
