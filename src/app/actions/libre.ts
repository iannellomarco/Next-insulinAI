'use server';

import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { createLibreClient, LibreGlucoseReading } from '@/lib/libre-client';

export interface LibreDataResponse {
    success: boolean;
    data?: LibreGlucoseReading[];
    error?: string;
    connectionName?: string;
}

export async function fetchLibreDataAction(): Promise<LibreDataResponse> {
    const { userId } = await auth();
    console.log('[fetchLibreDataAction] UserID:', userId);

    if (!userId) {
        console.error('[fetchLibreDataAction] No userId found in auth()');
        // If testing locally without auth, you might mock this, but for prod we need auth.
        return { success: false, error: 'Unauthorized: No verified session' };
    }

    try {
        // 1. Get credentials from DB
        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, userId),
        });

        console.log('[fetchLibreDataAction] Settings found:', !!settings);
        console.log('[fetchLibreDataAction] Has Libre Creds:', !!settings?.libreUsername, !!settings?.librePassword);

        if (!settings?.libreUsername || !settings?.librePassword) {
            return { success: false, error: 'No LibreLinkUp credentials found. Please update settings.' };
        }

        // 2. Initialize Client (Factory pattern)
        const client = createLibreClient({
            email: settings.libreUsername,
            password: settings.librePassword
        });

        // 3. Login
        console.log('Logging into LibreLinkUp...');
        const loginResponse = await client.login();

        if (!loginResponse) {
            return { success: false, error: 'Failed to login to LibreLinkUp. Check credentials or region.' };
        }

        console.log(`[LibreLinkUp] Logged in successfully. User ID: ${loginResponse.userId}`);

        // 4. Get Connection (Patient ID)
        // Note: New client handles auth internally via interceptors
        const connections = await client.getConnections();

        if (connections.length === 0) {
            return { success: false, error: 'No LibreLinkUp connections found.' };
        }

        // Use the first connection (usually the user themselves)
        const patient = connections[0];
        const patientId = patient.patientId || patient.id; // Library uses patientId, my interface has both mapped
        const patientName = `${patient.firstName} ${patient.lastName}`;
        console.log(`Fetching data for patient: ${patientName} (${patientId})`);

        // 5. Get Graph Data
        const readings = await client.getGlucoseData(patientId);

        console.log(`Retrieved ${readings.length} glucose readings.`);

        return {
            success: true,
            data: readings,
            connectionName: patientName
        };

    } catch (error) {
        console.error('Libre data fetch error:', error);
        return { success: false, error: 'Internal error fetching Libre data' };
    }
}
