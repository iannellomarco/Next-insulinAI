import Link from 'next/link';
import { History, Settings } from 'lucide-react';

export default function Header() {
    return (
        <header className="app-header">
            <h1>InsulinAI</h1>
            <div className="header-actions">
                <button className="icon-btn" aria-label="History">
                    <History size={24} />
                </button>
                <button className="icon-btn" aria-label="Settings">
                    <Settings size={24} />
                </button>
            </div>
        </header>
    );
}
