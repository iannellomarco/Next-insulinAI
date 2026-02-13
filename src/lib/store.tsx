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
    deleteHistoryItem: (id: string) => void;
    clearHistory: () => void;
    addFavorite: (favorite: Favorite) => void;
    removeFavorite: (id: string) => void;
    analysisResult: AnalysisResult | null;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    // Meal chaining
    chainedMeals: AnalysisResult[];
    addToChain: (result: AnalysisResult) => void;
    clearChain: () => void;
    isChaining: boolean;
    setIsChaining: (chaining: boolean) => void;
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

    // Blacklist for dismissed auto-suggested favorites (name-based)
    const [dismissedFavorites, setDismissedFavorites] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dismissedFavorites');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [chainedMeals, setChainedMeals] = useState<AnalysisResult[]>([]);
    const [isChaining, setIsChaining] = useState(false);

    const addToChain = (result: AnalysisResult) => {
        setChainedMeals(prev => [...prev, result]);
    };

    const clearChain = () => {
        setChainedMeals([]);
        setIsChaining(false);
    };

    // Auto-compute favorites from history
    const autoSuggestedFavorites = useMemo(() => {
        return analyzeHistoryForFavorites(history);
    }, [history]);

    // Combined favorites: manual + auto-suggested (avoiding duplicates and dismissed)
    const favorites = useMemo(() => {
        const manualIds = new Set(manualFavorites.map(f => f.name.toLowerCase()));
        const dismissedSet = new Set(dismissedFavorites.map(n => n.toLowerCase()));
        const autoFiltered = autoSuggestedFavorites.filter(
            f => !manualIds.has(f.name.toLowerCase()) && !dismissedSet.has(f.name.toLowerCase())
        );
        const combined = [...manualFavorites, ...autoFiltered];
        return getTimeRelevantFavorites(combined);
    }, [manualFavorites, autoSuggestedFavorites, dismissedFavorites]);

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
                console.log('[Store] Fetched remote history:', remoteHistory?.length);
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
        setHistory(prev => {
            const newHistory = [item, ...prev].slice(0, 50);
            localStorage.setItem('history', JSON.stringify(newHistory));
            return newHistory;
        });
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

    const deleteHistoryItem = (id: string) => {
        setHistory(prev => {
            const item = prev.find(h => h.id === id);
            let newHistory: HistoryItem[];

            // If item has a chainId, delete the entire chain
            if (item?.chainId) {
                newHistory = prev.filter(h => h.chainId !== item.chainId);
            } else {
                newHistory = prev.filter(h => h.id !== id);
            }

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
        // Check if it's a manual favorite
        const manualFav = manualFavorites.find(f => f.id === id);
        if (manualFav) {
            const newFavorites = manualFavorites.filter(f => f.id !== id);
            setManualFavorites(newFavorites);
            localStorage.setItem('favorites', JSON.stringify(newFavorites));
        }

        // Check if it's an auto-suggested favorite - add to blacklist
        const autoFav = autoSuggestedFavorites.find(f => f.id === id);
        if (autoFav) {
            const newDismissed = [...dismissedFavorites, autoFav.name.toLowerCase()];
            setDismissedFavorites(newDismissed);
            localStorage.setItem('dismissedFavorites', JSON.stringify(newDismissed));
        }
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
                deleteHistoryItem,
                clearHistory,
                addFavorite,
                removeFavorite,
                analysisResult,
                setAnalysisResult,
                isLoading,
                setIsLoading,
                chainedMeals,
                addToChain,
                clearChain,
                isChaining,
                setIsChaining,
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

