'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AnalysisResult, Settings, HistoryItem, Favorite, DEFAULT_SETTINGS } from '@/types';
import { useUser } from '@clerk/nextjs';
import {
    syncHistoryItemAction,
    getRemoteHistoryAction,
    syncSettingsAction,
    getRemoteSettingsAction,
    clearRemoteHistoryAction
} from '@/app/actions';
import {
    analyzeHistoryForFavorites,
    getTimeRelevantFavorites
} from './favorites-algorithm';

interface StoreContextType {
    settings: Settings;
    history: HistoryItem[];
    favorites: Favorite[];
    autoSuggestedFavorites: Favorite[];
    updateSettings: (newSettings: Partial<Settings>) => void;
    addHistoryItem: (item: HistoryItem) => void;
    updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
    clearHistory: () => void;
    addFavorite: (favorite: Favorite) => void;
    removeFavorite: (id: string) => void;
    analysisResult: AnalysisResult | null;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded: isAuthLoaded } = useUser();

    const [settings, setSettings] = useState<Settings>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        }
        return DEFAULT_SETTINGS;
    });

    const [history, setHistory] = useState<HistoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('history');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [manualFavorites, setManualFavorites] = useState<Favorite[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('favorites');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-compute favorites from history
    const autoSuggestedFavorites = useMemo(() => {
        return analyzeHistoryForFavorites(history);
    }, [history]);

    // Combined favorites: manual + auto-suggested (avoiding duplicates)
    const favorites = useMemo(() => {
        const manualIds = new Set(manualFavorites.map(f => f.name.toLowerCase()));
        const autoFiltered = autoSuggestedFavorites.filter(
            f => !manualIds.has(f.name.toLowerCase())
        );
        const combined = [...manualFavorites, ...autoFiltered];
        return getTimeRelevantFavorites(combined);
    }, [manualFavorites, autoSuggestedFavorites]);

    // Initial Load & Auth Sync
    useEffect(() => {
        if (!isAuthLoaded) return;

        const loadRemoteData = async () => {
            if (user) {
                console.log("User logged in, syncing with cloud...");

                // 1. Fetch Remote Settings
                const remoteSettings = await getRemoteSettingsAction();
                if (remoteSettings) {
                    setSettings(prev => {
                        const merged = { ...prev, ...remoteSettings };
                        localStorage.setItem('settings', JSON.stringify(merged));
                        return merged;
                    });
                } else {
                    await syncSettingsAction(settings);
                }

                // 2. Fetch Remote History
                const remoteHistory = await getRemoteHistoryAction();
                if (remoteHistory && remoteHistory.length > 0) {
                    setHistory(remoteHistory);
                    localStorage.setItem('history', JSON.stringify(remoteHistory));
                } else if (history.length > 0) {
                    for (const item of history) {
                        await syncHistoryItemAction(item);
                    }
                }
            }
        };

        loadRemoteData();
    }, [isAuthLoaded, user]);

    // Save Settings
    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('settings', JSON.stringify(updated));
        if (user) syncSettingsAction(updated);
    };

    // History Actions
    const addHistoryItem = (item: HistoryItem) => {
        const newHistory = [item, ...history].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem('history', JSON.stringify(newHistory));
        if (user) syncHistoryItemAction(item);
    };

    const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
        setHistory(prev => {
            const newHistory = prev.map(item => {
                if (item.id === id) {
                    const updated = { ...item, ...updates };
                    if (user) syncHistoryItemAction(updated);
                    return updated;
                }
                return item;
            });
            localStorage.setItem('history', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('history');
        if (user) clearRemoteHistoryAction();
    };

    // Favorites Actions
    const addFavorite = (favorite: Favorite) => {
        const newFavorites = [...manualFavorites, { ...favorite, isAutoSuggested: false }];
        setManualFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
    };

    const removeFavorite = (id: string) => {
        const newFavorites = manualFavorites.filter(f => f.id !== id);
        setManualFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
    };

    return (
        <StoreContext.Provider
            value={{
                settings,
                history,
                favorites,
                autoSuggestedFavorites,
                updateSettings,
                addHistoryItem,
                updateHistoryItem,
                clearHistory,
                addFavorite,
                removeFavorite,
                analysisResult,
                setAnalysisResult,
                isLoading,
                setIsLoading,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}

