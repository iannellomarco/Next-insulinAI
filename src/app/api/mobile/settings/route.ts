import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch user settings
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (result.length === 0) {
            return NextResponse.json(null);
        }

        const row = result[0];
        const defaultCarbRatios = { breakfast: 8, lunch: 10, dinner: 12 };

        return NextResponse.json({
            carbRatio: row.carbRatio || 10,
            carbRatios: row.carbRatios || defaultCarbRatios,
            useMealSpecificRatios: row.useMealSpecificRatios ?? false,
            correctionFactor: row.correctionFactor || 50,
            targetGlucose: row.targetGlucose || 110,
            highThreshold: row.highThreshold || 180,
            lowThreshold: row.lowThreshold || 70,
            smartHistory: row.smartHistory ?? true,
            libreUsername: row.libreUsername || '',
            librePassword: row.librePassword || '',
            language: row.language || 'en',
            analysisMode: row.analysisMode || 'pplx_only',
            aiProvider: row.aiProvider || 'perplexity',
        });
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST: Sync user settings
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await request.json();

        await db.insert(userSettings).values({
            userId,
            carbRatio: settings.carbRatio,
            carbRatios: settings.carbRatios,
            useMealSpecificRatios: settings.useMealSpecificRatios,
            correctionFactor: settings.correctionFactor,
            targetGlucose: settings.targetGlucose,
            highThreshold: settings.highThreshold,
            lowThreshold: settings.lowThreshold,
            smartHistory: settings.smartHistory,
            libreUsername: settings.libreUsername,
            librePassword: settings.librePassword,
            language: settings.language,
            analysisMode: settings.analysisMode,
            aiProvider: settings.aiProvider,
        }).onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                carbRatio: settings.carbRatio,
                carbRatios: settings.carbRatios,
                useMealSpecificRatios: settings.useMealSpecificRatios,
                correctionFactor: settings.correctionFactor,
                targetGlucose: settings.targetGlucose,
                highThreshold: settings.highThreshold,
                lowThreshold: settings.lowThreshold,
                smartHistory: settings.smartHistory,
                libreUsername: settings.libreUsername,
                librePassword: settings.librePassword,
                language: settings.language,
                analysisMode: settings.analysisMode,
                aiProvider: settings.aiProvider,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to sync settings:', error);
        return NextResponse.json({ error: 'Failed to sync settings' }, { status: 500 });
    }
}
