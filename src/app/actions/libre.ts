'use server';

import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { LibreLinkUpClient, LibreGlucoseReading } from '@/lib/libre-client';

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

        // 2. Login
        console.log('Logging into LibreLinkUp...');
        const authTicket = await LibreLinkUpClient.login({
            email: settings.libreUsername,
            password: settings.librePassword
        });

        if (!authTicket) {
            return { success: false, error: 'Failed to login to LibreLinkUp. Check credentials.' };
        }

        // 3. Get Connection (Patient ID)
        const connections = await LibreLinkUpClient.getConnections(authTicket.token);

        if (connections.length === 0) {
            return { success: false, error: 'No LibreLinkUp connections found.' };
        }

        // Use the first connection (usually the user themselves)
        const patientId = connections[0].id;
        const patientName = `${connections[0].firstName} ${connections[0].lastName}`;
        console.log(`Fetching data for patient: ${patientName} (${patientId})`);

        // 4. Get Graph Data
        const readings = await LibreLinkUpClient.getGlucoseData(authTicket.token, patientId);

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
