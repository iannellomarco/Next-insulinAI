'use client';

import { Camera, Edit3 } from 'lucide-react';
import { useRef } from 'react';

export default function ScanView({
    onAnalyze,
    onManualEntry
}: {
    onAnalyze: (input: File | string, type: 'image' | 'text') => void;
    onManualEntry: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleScanClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Handle file upload logic here (TODO)
            onAnalyze(file, 'image');
        }
    };

    return (
        <section id="scan-view" className="view">
            <div className="hero">
                <h2>What are you eating?</h2>
                <p>Take a photo or upload an image to get instant carb counts and insulin suggestions.</p>
            </div>

            <div className="action-area">
                <input
                    type="file"
                    id="file-input"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button id="scan-btn" className="btn primary huge" onClick={handleScanClick}>
                    <Camera size={48} />
                    Scan Food
                </button>

                <button id="type-food-btn" className="btn secondary huge" onClick={onManualEntry}>
                    <Edit3 size={48} />
                    Type Food
                </button>
            </div>
        </section>
    );
}
