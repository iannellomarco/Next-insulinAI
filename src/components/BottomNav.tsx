'use client';

import { Home, ClipboardList, BarChart3, Settings } from 'lucide-react';

type NavItem = 'home' | 'log' | 'insights' | 'settings';

interface BottomNavProps {
    active: NavItem;
    onNavigate: (item: NavItem) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
    const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
        { id: 'home', icon: <Home size={22} strokeWidth={active === 'home' ? 2.5 : 2} />, label: 'Home' },
        { id: 'log', icon: <ClipboardList size={22} strokeWidth={active === 'log' ? 2.5 : 2} />, label: 'History' },
        { id: 'insights', icon: <BarChart3 size={22} strokeWidth={active === 'insights' ? 2.5 : 2} />, label: 'Insights' },
        { id: 'settings', icon: <Settings size={22} strokeWidth={active === 'settings' ? 2.5 : 2} />, label: 'Settings' },
    ];

    return (
        <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`nav-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    aria-label={item.label}
                    aria-current={active === item.id ? 'page' : undefined}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}
