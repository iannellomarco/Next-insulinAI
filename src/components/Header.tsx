'use client';

import { User } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

export default function Header() {
    return (
        <header className="app-header">
            <h1>InsulinAI</h1>
            <div className="header-actions">
                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-10 h-10"
                            }
                        }}
                    />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="user-circle-btn" aria-label="Sign In">
                            <User size={24} />
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </header>
    );
}

