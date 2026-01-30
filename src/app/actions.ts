'use server';

import { db } from '@/db';
import { historyItems, userSettings } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';
import { HistoryItem, Settings } from '@/types';

// HISTORY ACTIONS

export async function syncHistoryItemAction(item: HistoryItem) {
    const { userId } = await auth();
    if (!userId) return { error: 'Unauthorized' };

    try {
        await db.insert(historyItems).values({
            id: item.id,
            userId,
            timestamp: new Date(item.timestamp),
            data: item, // Store the full object as JSON
        }).onConflictDoUpdate({
            target: historyItems.id,
            set: {
                data: item,
                timestamp: new Date(item.timestamp)
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to sync history item:', error);
        return { error: 'Failed to sync' };
    }
}

export async function getRemoteHistoryAction() {
    const { userId } = await auth();
    if (!userId) return [];

    try {
        const results = await db.select()
            .from(historyItems)
            .where(eq(historyItems.userId, userId))
            .orderBy(desc(historyItems.timestamp));

        // Extract the JSON data
        return results.map(r => r.data as HistoryItem);
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return [];
    }
}

export async function deleteHistoryItemAction(id: string) {
    const { userId } = await auth();
    if (!userId) return { error: 'Unauthorized' };

    try {
        await db.delete(historyItems)
            .where(eq(historyItems.id, id)); // Assuming ID is unique enough, ideally also filter by userId for safety
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete' };
    }
}

export async function clearRemoteHistoryAction() {
    const { userId } = await auth();
    if (!userId) return { error: 'Unauthorized' };

    try {
        await db.delete(historyItems).where(eq(historyItems.userId, userId));
        return { success: true };
    } catch (error) {
        return { error: 'Failed to clear' };
    }
}

// SETTINGS ACTIONS

export async function syncSettingsAction(settings: Settings) {
    const { userId } = await auth();
    if (!userId) return { error: 'Unauthorized' };

    try {
        await db.insert(userSettings).values({
            userId,
            carbRatio: settings.carbRatio,
            correctionFactor: settings.correctionFactor,
            targetGlucose: settings.targetGlucose,
            highThreshold: settings.highThreshold,
            lowThreshold: settings.lowThreshold,
            smartHistory: settings.smartHistory,
        }).onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                carbRatio: settings.carbRatio,
                correctionFactor: settings.correctionFactor,
                targetGlucose: settings.targetGlucose,
                highThreshold: settings.highThreshold,
                lowThreshold: settings.lowThreshold,
                smartHistory: settings.smartHistory,
                updatedAt: new Date()
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to sync settings:', error);
        return { error: 'Failed to sync settings' };
    }
}

export async function getRemoteSettingsAction() {
    const { userId } = await auth();
    if (!userId) return null;

    try {
        const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (result.length === 0) return null;

        const row = result[0];

        // Map back to Settings interface (excluding apiKey which is local/env only)
        const settings: Omit<Settings, 'apiKey'> = {
            carbRatio: row.carbRatio || 15,
            correctionFactor: row.correctionFactor || 50,
            targetGlucose: row.targetGlucose || 110,
            highThreshold: row.highThreshold || 180,
            lowThreshold: row.lowThreshold || 70,
            smartHistory: row.smartHistory ?? true,
        };
        return settings;
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return null;
    }
}
