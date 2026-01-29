const DIABETES_FACTS = [
    "Fiber helps slow down glucose absorption.",
    "Walking after meals can lower blood sugar.",
    "Protein and fat don't spike insulin as much as carbs.",
    "Hydration is key for better glucose control.",
    "Cinnamon may help improve insulin sensitivity.",
    "Stress releases hormones that can raise blood sugar.",
    "A good night's sleep improves insulin resistance.",
    "Whole grains are better than refined grains.",
    "Regular testing helps you spot patterns.",
    "The 'pizza effect' causes delayed glucose spikes."
];

export class UI {
    constructor() {
        this.views = {
            settings: document.getElementById('settings-view'),
            scan: document.getElementById('scan-view'),
            results: document.getElementById('results-view'),
            history: document.getElementById('history-view')
        };

        this.elements = {
            settingsBtn: document.getElementById('settings-btn'),
            historyBtn: document.getElementById('history-btn'), // New
            closeSettingsBtn: document.getElementById('close-settings'),
            saveSettingsBtn: document.getElementById('save-settings'),
            scanBtn: document.getElementById('scan-btn'),
            fileInput: document.getElementById('file-input'),
            imagePreviewContainer: document.getElementById('image-preview-container'),
            imagePreview: document.getElementById('image-preview'),
            analyzeBtn: document.getElementById('analyze-btn'),
            retakeBtn: document.getElementById('retake-btn'),
            backHomeBtn: document.getElementById('back-home'),
            homeFromHistoryBtn: document.getElementById('home-from-history-btn'), // New
            loading: document.getElementById('loading'),
            analysisContent: document.getElementById('analysis-content'),
            historyList: document.getElementById('history-list'), // New

            // Inputs
            apiKey: document.getElementById('api-key'),
            carbRatio: document.getElementById('carb-ratio'),
            correctionFactor: document.getElementById('correction-factor'),
            highThreshold: document.getElementById('high-threshold'),
            lowThreshold: document.getElementById('low-threshold'),
            smartHistory: document.getElementById('smart-history'), // New
            clearHistoryBtn: document.getElementById('clear-history-btn'), // New

            // Modal Elements
            glucoseModal: document.getElementById('glucose-modal'),
            glucoseInput: document.getElementById('glucose-input'),

            // Confirmation Modal
            confirmationModal: document.getElementById('confirmation-modal'),
            saveGlucoseBtn: document.getElementById('save-glucose-btn'),
            cancelGlucoseBtn: document.getElementById('cancel-glucose-btn')
        };
    }

    showView(viewName) {
        // Settings is an overlay, so we handle it separately
        if (viewName === 'settings') {
            this.views.settings.classList.remove('hidden');
        } else {
            // Hide all main views
            Object.values(this.views).forEach(el => {
                if (el.id !== 'settings-view') el.classList.add('hidden');
            });
            // Show target
            this.views[viewName].classList.remove('hidden');
        }
    }

    hideSettings() {
        this.views.settings.classList.add('hidden');
    }

    // Glucose Modal Methods
    showGlucoseModal(currentValue, onSave) {
        this.elements.glucoseModal.classList.remove('hidden');
        this.elements.glucoseModal.style.display = 'flex'; // Ensure flex layout
        this.elements.glucoseInput.value = currentValue || '';
        this.elements.glucoseInput.focus();

        // Remove old listeners to prevent stacking
        const newSaveBtn = this.elements.saveGlucoseBtn.cloneNode(true);
        this.elements.saveGlucoseBtn.parentNode.replaceChild(newSaveBtn, this.elements.saveGlucoseBtn);
        this.elements.saveGlucoseBtn = newSaveBtn;

        const newCancelBtn = this.elements.cancelGlucoseBtn.cloneNode(true);
        this.elements.cancelGlucoseBtn.parentNode.replaceChild(newCancelBtn, this.elements.cancelGlucoseBtn);
        this.elements.cancelGlucoseBtn = newCancelBtn;

        // Bind new listeners
        this.elements.saveGlucoseBtn.addEventListener('click', () => {
            const val = this.elements.glucoseInput.value;
            if (val) onSave(val);
            this.hideGlucoseModal();
        });

        this.elements.cancelGlucoseBtn.addEventListener('click', () => this.hideGlucoseModal());
    }

    hideGlucoseModal() {
        this.elements.glucoseModal.classList.add('hidden');
        setTimeout(() => {
            this.elements.glucoseModal.style.display = 'none';
        }, 300); // Matches CSS transition
    }

    showTextInputModal(onAnalyze) {
        const modal = document.getElementById('text-input-modal');
        const input = document.getElementById('food-text-modal-input');
        const analyzeBtn = document.getElementById('analyze-text-btn');
        const closeBtn = document.getElementById('close-text-modal');
        const errorMsg = document.getElementById('text-input-error');

        input.value = '';
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
        modal.classList.remove('hidden');

        const close = () => {
            modal.classList.add('hidden');
            // Cleanup listeners to prevent duplicates if opened again
            analyzeBtn.replaceWith(analyzeBtn.cloneNode(true));
            closeBtn.replaceWith(closeBtn.cloneNode(true));
        };

        // We re-bind close button every time after clone
        document.getElementById('close-text-modal').addEventListener('click', close);

        const analyzeHandler = () => {
            const text = input.value.trim();
            if (!text) return;

            // Callback allows App to handle the async work (and errors)
            if (onAnalyze) {
                onAnalyze(text, (error) => {
                    // Error Callback
                    if (error) {
                        errorMsg.textContent = error;
                        errorMsg.classList.remove('hidden');
                    } else {
                        // Success
                        close();
                    }
                });
            }
        };

        document.getElementById('analyze-text-btn').addEventListener('click', analyzeHandler);
    }

    showError(message) {
        const modal = document.getElementById('error-modal');
        const msgEl = document.getElementById('error-modal-message');
        const closeBtn = document.getElementById('close-error-modal');

        msgEl.textContent = message;
        modal.classList.remove('hidden');

        const close = () => {
            modal.classList.add('hidden');
            closeBtn.removeEventListener('click', close);
        };

        closeBtn.addEventListener('click', close);
    }

    showConfirmationModal(title, message, onConfirm) {
        const modal = this.elements.confirmationModal;
        if (!modal) return;

        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.innerHTML = message;

        // Clone buttons to remove old listeners
        const newOk = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOk, okBtn);

        const newCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newOk.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            modal.classList.add('hidden');
        });

        newCancel.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        modal.classList.remove('hidden');
    }

    updateSettingsForm(settings) {
        this.elements.apiKey.value = settings.apiKey || '';
        this.elements.carbRatio.value = settings.carbRatio || 10;
        this.elements.correctionFactor.value = settings.correctionFactor || 50;
        this.elements.highThreshold.value = settings.highThreshold || 180;
        this.elements.lowThreshold.value = settings.lowThreshold || 70;
        this.elements.smartHistory.checked = settings.smartHistory !== false; // Default true
    }

    getSettingsFromForm() {
        return {
            apiKey: this.elements.apiKey.value.trim(),
            carbRatio: parseFloat(this.elements.carbRatio.value) || 10,
            correctionFactor: parseFloat(this.elements.correctionFactor.value) || 50,
            highThreshold: parseFloat(this.elements.highThreshold.value) || 180,
            lowThreshold: parseFloat(this.elements.lowThreshold.value) || 70,
            smartHistory: this.elements.smartHistory.checked
        };
    }

    showPreview(base64Image) {
        this.elements.imagePreview.src = base64Image;
        this.elements.imagePreviewContainer.classList.remove('hidden');
        this.elements.scanBtn.parentElement.classList.add('hidden'); // Hide big button
    }

    resetScanView() {
        this.elements.imagePreviewContainer.classList.add('hidden');
        this.elements.scanBtn.parentElement.classList.remove('hidden');
        this.elements.fileInput.value = '';
    }

    toggleLoading(active) {
        if (active) {
            this.elements.loading.style.display = 'flex';
            this.elements.analysisContent.style.display = 'none';

            // Start Fact Rotation
            const factEl = document.getElementById('loading-fact');
            if (factEl) {
                // Show first fact immediately
                factEl.textContent = DIABETES_FACTS[Math.floor(Math.random() * DIABETES_FACTS.length)];

                this.loadingInterval = setInterval(() => {
                    factEl.style.opacity = '0';
                    setTimeout(() => {
                        factEl.textContent = DIABETES_FACTS[Math.floor(Math.random() * DIABETES_FACTS.length)];
                        factEl.style.opacity = '1';
                    }, 300); // Wait for fade out
                }, 4000); // Change every 4s
            }
        } else {
            this.elements.loading.style.display = 'none';
            this.elements.analysisContent.style.display = 'block';

            // Stop Fact Rotation
            if (this.loadingInterval) {
                clearInterval(this.loadingInterval);
                this.loadingInterval = null;
            }
        }
    }

    renderResults(data) {
        const h = this.elements.analysisContent;
        h.innerHTML = ''; // Clear prev

        // Summary Card
        const summary = document.createElement('div');
        summary.className = 'summary-card';

        // Friendly AI Message
        if (data.friendly_description) {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-message';
            aiMsg.style.marginBottom = '16px';
            aiMsg.style.fontStyle = 'italic';
            aiMsg.textContent = data.friendly_description;
            summary.appendChild(aiMsg);
        }

        summary.innerHTML += `
            <h3>Suggested Insulin</h3>
            <div class="insulin-dose">${data.suggested_insulin} <span class="unit">units</span></div>
            <p style="color: rgba(255,255,255,0.8); margin-top:4px;">${data.total_carbs}g Carbs</p>
        `;
        h.appendChild(summary);

        // Split Bolus Recommendation
        if (data.split_bolus_recommendation && data.split_bolus_recommendation.recommended) {
            const splitCard = document.createElement('div');
            splitCard.className = 'split-bolus-card';
            splitCard.innerHTML = `
                <div class="split-header">
                    <span class="split-icon">🍕</span>
                    <h3>Split Bolus Suggested</h3>
                </div>
                <div class="split-details">
                    <p><strong>Strategy:</strong> ${data.split_bolus_recommendation.split_percentage}</p>
                    <p><strong>Duration:</strong> ${data.split_bolus_recommendation.duration}</p>
                    <p class="split-reason">${data.split_bolus_recommendation.reason}</p>
                </div>
            `;
            h.appendChild(splitCard);
        }

        // Foods List
        const list = document.createElement('div');
        list.className = 'result-card';
        list.innerHTML = `<h3>Detailed Breakdown</h3>`;

        data.food_items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'food-item';
            row.innerHTML = `
                <div class="food-name">${item.name}</div>
                <div class="food-macros">${item.carbs}g C • ${item.fat}g F • ${item.protein}g P</div>
            `;
            list.appendChild(row);
        });
        h.appendChild(list);

        // Warnings
        if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach(warn => {
                const w = document.createElement('div');
                w.className = 'warning-box';
                w.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <span>${warn}</span>
                `;
                h.appendChild(w);
            });
        }
    }

    renderHistory(historyItems, settings, onEditClick) {
        const list = this.elements.historyList;
        list.innerHTML = '';

        const highLimit = settings.highThreshold || 180;
        const lowLimit = settings.lowThreshold || 70;

        if (!historyItems || historyItems.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">No history yet.</div>`;
            return;
        }

        historyItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';

            const date = new Date(item.timestamp).toLocaleString();
            const glucoseDisplay = item.post_glucose
                ? `${item.post_glucose} mg/dL`
                : '<span style="opacity:0.6; font-style:italic">Tap to add</span>';

            const glucoseClass = item.post_glucose > highLimit ? 'high' :
                (item.post_glucose < lowLimit ? 'high' : // Reuse high (red) style for low as requested
                    (item.post_glucose ? 'good' : ''));

            el.innerHTML = `
                <div class="history-header">
                    <span>${date}</span>
                </div>
                <div class="history-main">
                    <span class="history-food">${item.food_name || 'Unknown Food'}</span>
                    <span class="history-dose">${item.actual_insulin || item.suggested_insulin}u</span>
                </div>
                <div class="history-stats">
                    <span>${item.carbs}g Carbs</span>
                    <span class="stat-glucose ${glucoseClass}">
                        <span>2hr BG:</span>
                        <strong>${glucoseDisplay}</strong>
                    </span>
                </div>
            `;

            el.addEventListener('click', () => onEditClick(item));
            list.appendChild(el);
        });
    }
}
