'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AnalysisResult, Settings, HistoryItem, DEFAULT_SETTINGS } from '@/types';

interface StoreContextType {
    settings: Settings;
    history: HistoryItem[];
    updateSettings: (newSettings: Partial<Settings>) => void;
    addHistoryItem: (item: HistoryItem) => void;
    updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
    clearHistory: () => void;
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

    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
                    // First time? Sync local settings to cloud
                    await syncSettingsAction(settings);
                }

                // 2. Fetch Remote History
                // Strategy: Remote is source of truth if we want full sync across devices.
                // Or merge? For simplicity, let's load Remote and replace Local representation.
                const remoteHistory = await getRemoteHistoryAction();
                if (remoteHistory && remoteHistory.length > 0) {
                    setHistory(remoteHistory);
                    localStorage.setItem('history', JSON.stringify(remoteHistory));
                } else if (history.length > 0) {
                    // If remote is empty but we have local, push local to remote (Initial Sync)
                    // Push sequentially to order
                    for (const item of history) {
                        await syncHistoryItemAction(item);
                    }
                }
            }
        };

        loadRemoteData();
    }, [isAuthLoaded, user]); // Only run when auth state settles

    // Save Settings
    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('settings', JSON.stringify(updated));
        if (user) syncSettingsAction(updated);
    };

    // History Actions
    const addHistoryItem = (item: HistoryItem) => {
        const newHistory = [item, ...history].slice(0, 50); // Keep last 50
        setHistory(newHistory);
        localStorage.setItem('history', JSON.stringify(newHistory));
        if (user) syncHistoryItemAction(item);
    };

    const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
        setHistory(prev => {
            const newHistory = prev.map(item => {
                if (item.id === id) {
                    const updated = { ...item, ...updates };
                    if (user) syncHistoryItemAction(updated); // Sync the update
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

    // Prevent flash of default content until loaded (optional, handled in UI usually)
    // if (!loaded) return null; 

    return (
        <StoreContext.Provider
            value={{
                settings,
                history,
                updateSettings,
                addHistoryItem,
                updateHistoryItem,
                clearHistory,
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
