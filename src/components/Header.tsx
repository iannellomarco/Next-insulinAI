import Link from 'next/link';
import { History, Settings, LogIn } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

interface HeaderProps {
    onHistoryClick: () => void;
    onSettingsClick: () => void;
}

export default function Header({ onHistoryClick, onSettingsClick }: HeaderProps) {

    return (
        <header className="app-header">
            <h1>InsulinAI</h1>
            <div className="header-actions">
                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8"
                            }
                        }}
                    />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="icon-btn" aria-label="Sign In">
                            <LogIn size={24} />
                        </button>
                    </SignInButton>
                </SignedOut>

                <button
                    className="icon-btn"
                    onClick={onHistoryClick}
                    aria-label="History"
                >
                    <History size={24} />
                </button>
                <button
                    className="icon-btn"
                    onClick={onSettingsClick}
                    aria-label="Settings"
                >
                    <Settings size={24} />
                </button>
            </div>
        </header>
    );
}
