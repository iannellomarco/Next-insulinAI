import { Store } from './store.js?v=20';
import { UI } from './ui.js?v=20';
import { AIService } from './ai-service.js?v=20';
import { fileToBase64, resizeImage } from './utils.js?v=20';

class App {
    constructor() {
        this.store = new Store();
        this.ui = new UI();
        this.ai = new AIService(this.store);

        this.currentImage = null; // Base64 string

        this.init();
    }

    init() {
        this.bindEvents();

        // Initial check for settings
        const settings = this.store.getSettings();
        this.ui.updateSettingsForm(settings);

        this.ui.showView('scan');
    }

    bindEvents() {
        // Settings Navigation
        if (this.ui.elements.settingsBtn)
            this.ui.elements.settingsBtn.addEventListener('click', () => this.ui.showView('settings'));
        if (this.ui.elements.closeSettingsBtn)
            this.ui.elements.closeSettingsBtn.addEventListener('click', () => this.ui.hideSettings());

        // History Navigation
        if (this.ui.elements.historyBtn)
            this.ui.elements.historyBtn.addEventListener('click', () => {
                this.renderHistoryView();
                this.ui.showView('history');
            });

        if (this.ui.elements.homeFromHistoryBtn)
            this.ui.elements.homeFromHistoryBtn.addEventListener('click', () => {
                this.ui.showView('scan');
            });

        // Clear History
        if (this.ui.elements.clearHistoryBtn) {
            this.ui.elements.clearHistoryBtn.addEventListener('click', () => {
                this.ui.showConfirmationModal(
                    "Clear History?",
                    "Are you sure you want to delete all history? <strong>This cannot be undone.</strong>",
                    () => {
                        const empty = this.store.clearHistory();
                        this.ui.renderHistory(empty, this.store.getSettings(), this.handleHistoryEdit.bind(this));
                    }
                );
            });
        }

        // Save Settings
        if (this.ui.elements.saveSettingsBtn)
            this.ui.elements.saveSettingsBtn.addEventListener('click', () => {
                const formData = this.ui.getSettingsFromForm();
                // API Key is optional now

                this.store.saveSettings(formData);
                this.ui.hideSettings();
                // If we were stuck on settings, go to scan
                if (this.ui.views.scan.classList.contains('hidden') && this.ui.views.results.classList.contains('hidden')) {
                    this.ui.showView('scan');
                }
            });

        // Scan / File Input
        if (this.ui.elements.scanBtn)
            this.ui.elements.scanBtn.addEventListener('click', () => {
                this.ui.elements.fileInput.click();
            });

        if (this.ui.elements.fileInput)
            this.ui.elements.fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    // Convert to Base64
                    const base64Raw = await fileToBase64(file);
                    // Resize to avoid huge payloads (Max 1024px)
                    const resized = await resizeImage(base64Raw, 1024);

                    this.currentImage = resized;
                    this.ui.showPreview(this.currentImage);
                } catch (err) {
                    console.error("Image processing error", err);
                    this.ui.showError("Failed to process image.");
                }
            });

        // Analyze Image
        if (this.ui.elements.analyzeBtn)
            this.ui.elements.analyzeBtn.addEventListener('click', () => this.handleAnalysis(this.currentImage, 'image'));

        // Type Food Button
        const typeFoodBtn = document.getElementById('type-food-btn');
        if (typeFoodBtn) {
            typeFoodBtn.addEventListener('click', () => {
                console.log("Type Food Clicked");
                this.ui.showTextInputModal(async (text, doneCallback) => {
                    // This callback runs when user clicks Analyze in modal
                    // We handle the analysis logic here
                    try {
                        await this.handleAnalysis(text, 'text', doneCallback);
                    } catch (e) {
                        // handleAnalysis catches most things, but just in case
                        doneCallback(e.message);
                    }
                });
            });
        } else {
            console.warn("Type Food Button not found during bindEvents");
        }

        // Retake
        if (this.ui.elements.retakeBtn)
            this.ui.elements.retakeBtn.addEventListener('click', () => {
                this.currentImage = null;
                this.ui.resetScanView();
            });

        // Back Home
        if (this.ui.elements.backHomeBtn)
            this.ui.elements.backHomeBtn.addEventListener('click', () => {
                this.ui.showView('scan');
                this.ui.resetScanView();
                this.currentImage = null;
            });
    }

    // Updated handleAnalysis to accept a completion callback for modal error handling
    async handleAnalysis(input, type, doneCallback) {
        if (!input) return;

        // API Key is optional, handled by backend


        if (type === 'image') {
            this.ui.showView('results');
            this.ui.toggleLoading(true);
        } else {
            // For text, we might want to show loading distinctively if staying in modal, 
            // but the requirement says "kicks a modal out... if input is outside guidelines gives error message"
            // So if success -> close modal & show results. If error -> stay in modal.
            // Let's toggle main loading only if verify passed.
            // Actually, we need to call API to verify. So we must wait.
            // Let's show loading on the button or global?
            // For simplicity, we'll reuse the global loading but maybe keep modal open? 
            // The flow implies: Modal -> Analyze -> (Wait) -> (Success -> ResultsView) OR (Error -> Show Err in Modal)
            const analyzeBtn = document.getElementById('analyze-text-btn');
            if (analyzeBtn) {
                analyzeBtn.textContent = "Analyzing...";
                analyzeBtn.disabled = true;
            }
        }

        try {
            // Pass history context
            const history = this.store.getHistory();
            const result = await this.ai.analyzeContent(input, type, history);
            console.log("Analysis Result:", result);

            // If we are here, it was successful
            if (doneCallback) doneCallback(null); // Clear errors / close modal

            this.ui.renderResults(result);
            if (type !== 'image') {
                this.ui.showView('results');
            }

            // Save to History
            this.saveToHistory(result);

        } catch (error) {
            console.error(error);

            // If we have a callback (Text Modal), we pass the error back to be displayed IN the modal
            if (doneCallback && (error.message.includes('guidelines') || error.message.includes('only help with food') || error.message.includes('rejected_non_food'))) {
                doneCallback(error.message);
            } else if (doneCallback) {
                // Other errors for text modal
                doneCallback(error.message);
            } else {
                // Image mode or generic
                this.ui.showError(error.message);
                this.ui.showView('scan'); // Go back
            }
        } finally {
            if (type === 'image') {
                this.ui.toggleLoading(false);
            } else {
                const analyzeBtn = document.getElementById('analyze-text-btn');
                if (analyzeBtn) {
                    analyzeBtn.textContent = "Analyze Text";
                    analyzeBtn.disabled = false;
                }
            }
        }
    }



    renderHistoryView() {
        const history = this.store.getHistory();
        const settings = this.store.getSettings();
        this.ui.renderHistory(history, settings, (item) => this.handleHistoryEdit(item));
    }

    handleHistoryEdit(item) {
        this.ui.showGlucoseModal(item.post_glucose, (val) => {
            const numVal = parseInt(val);
            if (!isNaN(numVal)) {
                this.store.updateHistoryItem(item.id, { post_glucose: numVal });
                this.renderHistoryView(); // Refresh list
            }
        });
    }

    saveToHistory(result) {
        const item = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            food_name: result.food_items.map(f => f.name).join(', '),
            analysis: result,
            carbs: result.total_carbs,
            suggested_insulin: result.suggested_insulin,
            actual_insulin: result.suggested_insulin, // Assume accepted for now, could be editable later
            pre_glucose: null, // Could prompt for this
            post_glucose: null
        };
        this.store.saveHistoryItem(item);
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new App();
        console.log("App initialized successfully");
    } catch (e) {
        console.error("App initialization failed:", e);
    }
});
