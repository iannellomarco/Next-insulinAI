'use client';

import { User, Droplets } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

export default function Header() {
    return (
        <header className="app-header">
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Droplets className="w-5 h-5 text-primary" />
                </div>
                <h1>InsulinAI</h1>
            </div>
            <div className="header-actions">
                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-9 h-9 ring-2 ring-border"
                            }
                        }}
                    />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="user-circle-btn" aria-label="Sign In">
                            <User size={20} />
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </header>
    );
}
