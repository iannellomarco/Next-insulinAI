'use server';

import { db } from '@/db';
import { historyItems, userSettings } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, desc, gte, asc } from 'drizzle-orm';
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
            carbRatios: settings.carbRatios,
            useMealSpecificRatios: settings.useMealSpecificRatios,
            correctionFactor: settings.correctionFactor,
            targetGlucose: settings.targetGlucose,
            highThreshold: settings.highThreshold,
            lowThreshold: settings.lowThreshold,
            smartHistory: settings.smartHistory,
            libreUsername: settings.libreUsername,
            librePassword: settings.librePassword,
        }).onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                carbRatio: settings.carbRatio,
                carbRatios: settings.carbRatios,
                useMealSpecificRatios: settings.useMealSpecificRatios,
                correctionFactor: settings.correctionFactor,
                highThreshold: settings.highThreshold,
                lowThreshold: settings.lowThreshold,
                smartHistory: settings.smartHistory,
                libreUsername: settings.libreUsername,
                librePassword: settings.librePassword,
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
        const defaultCarbRatios = { breakfast: 8, lunch: 10, dinner: 12 };
        const settings: Omit<Settings, 'apiKey'> = {
            carbRatio: row.carbRatio || 10,
            carbRatios: (row.carbRatios as { breakfast: number; lunch: number; dinner: number }) || defaultCarbRatios,
            useMealSpecificRatios: row.useMealSpecificRatios ?? false,
            correctionFactor: row.correctionFactor || 50,
            targetGlucose: row.targetGlucose || 110,
            highThreshold: row.highThreshold || 180,
            lowThreshold: row.lowThreshold || 70,
            smartHistory: row.smartHistory ?? true,
            libreUsername: row.libreUsername || '',
            librePassword: row.librePassword || '',
        };
        return settings;

    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return null;
    }
}

export async function getReportDataAction(days: number) {
    const { userId } = await auth();
    if (!userId) return { error: 'Unauthorized' };

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0); // Start of the day

        const records = await db.select()
            .from(historyItems)
            .where(eq(historyItems.userId, userId))
            .orderBy(asc(historyItems.timestamp));

        // Filter by date in memory (since we want flexible date logic)
        const filteredRecords = records.filter(r => new Date(r.timestamp) >= startDate);

        // Aggregate Data
        let totalPreGlucose = 0;
        let countPreGlucose = 0;
        let totalPostGlucose = 0;
        let countPostGlucose = 0;
        let totalInsulin = 0;
        let totalCarbs = 0;

        const dailyStatsMap = new Map<string, { date: string, timestamp: number, totalInsulin: number, piCount: number, glucoseSum: number }>();

        // Initialize map with all days in range to ensure continuous chart
        for (let i = 0; i <= days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - i));
            const dateKey = d.toLocaleDateString();
            dailyStatsMap.set(dateKey, {
                date: dateKey,
                timestamp: d.getTime(),
                totalInsulin: 0,
                piCount: 0,
                glucoseSum: 0
            });
        }

        for (const record of filteredRecords) {
            const data = record.data as HistoryItem;

            // Averages
            if (data.pre_glucose) {
                totalPreGlucose += data.pre_glucose;
                countPreGlucose++;
            }
            if (data.post_glucose) {
                totalPostGlucose += data.post_glucose;
                countPostGlucose++;
            }

            // Totals
            if (data.suggested_insulin) {
                totalInsulin += data.suggested_insulin;
            }
            if (data.total_carbs) {
                totalCarbs += data.total_carbs;
            }

            // Daily Stats for Chart
            const rDate = new Date(data.timestamp);
            const dateKey = rDate.toLocaleDateString();

            if (dailyStatsMap.has(dateKey)) {
                const dayStat = dailyStatsMap.get(dateKey)!;
                dayStat.totalInsulin += data.suggested_insulin || 0;

                // Use post glucose for daily average if available, else pre
                const glucose = data.post_glucose || data.pre_glucose;
                if (glucose) {
                    dayStat.glucoseSum += glucose;
                    dayStat.piCount++;
                }
            }
        }

        // Calculate final daily averages and sort by date
        const dailyStats = Array.from(dailyStatsMap.values())
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(day => ({
                date: day.date, // You might want to format this for the chart, e.g. "Mon" or "Jun 1"
                avgGlucose: day.piCount > 0 ? Math.round(day.glucoseSum / day.piCount) : 0,
                totalInsulin: day.totalInsulin,
            }));

        return {
            summary: {
                avgPreGlucose: countPreGlucose > 0 ? Math.round(totalPreGlucose / countPreGlucose) : 0,
                avgPostGlucose: countPostGlucose > 0 ? Math.round(totalPostGlucose / countPostGlucose) : 0,
                totalInsulin: Math.round(totalInsulin * 10) / 10,
                totalCarbs: Math.round(totalCarbs),
                count: filteredRecords.length
            },
            dailyStats
        };

    } catch (error) {
        console.error('Failed to get report data:', error);
        return { error: 'Failed to generate report' };
    }
}

