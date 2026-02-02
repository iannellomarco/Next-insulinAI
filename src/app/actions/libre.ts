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
}

export async function fetchLibreDataAction(): Promise<LibreDataResponse> {
    const { userId } = await auth();
    console.log('[fetchLibreDataAction] UserID:', userId);

    if (!userId) {
        console.error('[fetchLibreDataAction] No userId found in auth()');
        return { success: false, error: 'Unauthorized: No verified session' };
    }

    try {
        // 1. Get credentials from DB
        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, userId),
        });

        console.log('[fetchLibreDataAction] Settings found:', !!settings);

        if (!settings?.libreUsername || !settings?.librePassword) {
            return { success: false, error: 'No LibreLinkUp credentials found. Please update settings.' };
        }

        // 2. Initialize Client using DRFR0ST library
        const client = new LibreLinkClient({
            email: settings.libreUsername,
            password: settings.librePassword,
            cache: false // Don't cache in server action context
        });

        // 3. Login (handles region redirects internally)
        console.log('[LibreLinkUp] Logging in...');
        await client.login();
        console.log('[LibreLinkUp] Login successful!');

        // 4. Get connections to find patient name
        const connections = await client.fetchConnections();
        const patientName = connections?.data?.[0]
            ? `${connections.data[0].firstName} ${connections.data[0].lastName}`
            : 'Unknown';
        console.log(`[LibreLinkUp] Connected to: ${patientName}`);

        // 5. Get current reading
        const currentReading = await client.read();
        console.log('[LibreLinkUp] Current reading:', currentReading?.value);

        // 6. Get history (graph data)
        const history = await client.history();
        console.log(`[LibreLinkUp] Retrieved ${history?.length || 0} historical readings`);

        // 7. Transform readings to our format
        const transformReading = (reading: any): GlucoseReading => ({
            value: reading.value,
            timestamp: reading.timestamp,
            trendType: reading.trendType || 'Unknown',
            isHigh: reading.isHigh || false,
            isLow: reading.isLow || false,
        });

        return {
            success: true,
            currentReading: currentReading ? transformReading(currentReading) : undefined,
            data: history?.map(transformReading) || [],
            connectionName: patientName
        };

    } catch (error) {
        console.error('[LibreLinkUp] Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}
