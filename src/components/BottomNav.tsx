'use client';

import { Home, FileText, BarChart2, Settings } from 'lucide-react';

type NavItem = 'home' | 'log' | 'insights' | 'settings';

interface BottomNavProps {
    active: NavItem;
    onNavigate: (item: NavItem) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
    const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
        { id: 'home', icon: <Home size={24} />, label: 'Home' },
        { id: 'log', icon: <FileText size={24} />, label: 'Log' },
        { id: 'insights', icon: <BarChart2 size={24} />, label: 'Insights' },
        { id: 'settings', icon: <Settings size={24} />, label: 'Settings' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`nav-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    aria-label={item.label}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}
