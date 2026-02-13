'use server';

import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { LibreLinkClient } from 'libre-link-unofficial-api';

// Re-export types for frontend use
export interface GlucoseReading {
    value: number;      // mg/dL
    timestamp: Date;
    trendType: string;  // e.g., "Flat", "FortyFiveUp", etc.
    isHigh: boolean;
    isLow: boolean;
}

export interface LibreDataResponse {
    success: boolean;
    data?: GlucoseReading[];
    currentReading?: GlucoseReading;
    error?: string;
    connectionName?: string;
    debug?: {
        oldest: string;
        newest: string;
        count: number;
    };
}

// Simple in-memory cache
interface CacheEntry {
    timestamp: number;
    response: LibreDataResponse;
    userId: string;
}

let requestCache: CacheEntry | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchLibreDataAction(): Promise<LibreDataResponse> {
    const { userId } = await auth();
    console.log('[fetchLibreDataAction] UserID:', userId);

    if (!userId) {
        return { success: false, error: 'Unauthorized: No verified session' };
    }

    // Since we moved credential storage to the iOS app (Keychain),
    // the backend can no longer connect to LibreLinkUp directly.
    return {
        success: false,
        error: 'LibreLink connection is now handled directly on your mobile device for enhanced security. Web view is currently unavailable.'
    };
}
