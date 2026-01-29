export class Store {
    constructor() {
        this.STORAGE_KEY = 'insulin-calc-ai-settings';
        this.defaultSettings = {
            apiKey: '', // Empty by default
            carbRatio: 10, // 1 unit per 10g carbs
            correctionFactor: 50,
            highThreshold: 180,
            lowThreshold: 70,
            smartHistory: true // Default to true
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return { ...this.defaultSettings, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error("Failed to load settings, resetting to defaults:", e);
            // Optionally clear bad data
            localStorage.removeItem(this.STORAGE_KEY);
        }
        return { ...this.defaultSettings };
    }

    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
        console.log('Settings saved:', this.settings);
    }

    // History Management
    getHistory() {
        const h = localStorage.getItem('insulin_calc_history');
        return h ? JSON.parse(h) : [];
    }

    saveHistoryItem(item) {
        const history = this.getHistory();
        history.unshift(item); // Add to top
        // Limit to 50 items to save space
        if (history.length > 50) history.pop();
        localStorage.setItem('insulin_calc_history', JSON.stringify(history));
    }

    updateHistoryItem(id, updates) {
        const history = this.getHistory();
        const index = history.findIndex(i => i.id === id);
        if (index !== -1) {
            history[index] = { ...history[index], ...updates };
            localStorage.setItem('insulin_calc_history', JSON.stringify(history));
            return true;
        }
        return false;
    }

    clearHistory() {
        localStorage.removeItem('insulin_calc_history');
        return [];
    }


    getSettings() {
        return this.settings;
    }

    hasApiKey() {
        return true; // Always allow entering the app
    }
}
