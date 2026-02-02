'use client';

import { Home, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { useTranslations } from '@/lib/translations';

type NavItem = 'home' | 'log' | 'insights' | 'settings';

interface BottomNavProps {
    active: NavItem;
    onNavigate: (item: NavItem) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
    const t = useTranslations();
    const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
        { id: 'home', icon: <Home size={22} strokeWidth={active === 'home' ? 2.5 : 2} />, label: t.nav.home },
        { id: 'log', icon: <ClipboardList size={22} strokeWidth={active === 'log' ? 2.5 : 2} />, label: t.nav.history },
        { id: 'insights', icon: <BarChart3 size={22} strokeWidth={active === 'insights' ? 2.5 : 2} />, label: t.nav.insights },
        { id: 'settings', icon: <Settings size={22} strokeWidth={active === 'settings' ? 2.5 : 2} />, label: t.nav.settings },
    ];

    return (
        <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`nav-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        onNavigate(item.id);
                    }}
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
