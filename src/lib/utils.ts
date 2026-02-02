import { HistoryItem } from '@/types';

export interface DailyStat {
    date: string;
    dateLabel: string;
    avgGlucose: number;
    totalInsulin: number;
}

export interface ReportData {
    summary: {
        avgPreGlucose: number;
        avgPostGlucose: number;
        totalInsulin: number;
        totalCarbs: number;
        count: number;
    };
    dailyStats: DailyStat[];
}

export const calculateReportData = (history: HistoryItem[], days: number, lang = 'en'): ReportData => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const filteredRecords = history.filter(item => new Date(item.timestamp) >= startDate);

    // Aggregate Data
    let totalPreGlucose = 0;
    let countPreGlucose = 0;
    let totalPostGlucose = 0;
    let countPostGlucose = 0;
    let totalInsulin = 0;
    let totalCarbs = 0;

    const dailyStatsMap = new Map<string, { date: string, dateLabel: string, timestamp: number, totalInsulin: number, piCount: number, glucoseSum: number }>();

    // Initialize map with all days - use ISO date string as key for reliable parsing
    for (let i = 0; i <= days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - i));
        d.setHours(0, 0, 0, 0);
        // Use ISO format for reliable key/parsing: YYYY-MM-DD
        const dateKey = d.toISOString().split('T')[0];
        const locale = lang === 'it' ? 'it-IT' : 'en-US';
        const dateLabel = d.toLocaleDateString(locale, { weekday: 'short' });
        dailyStatsMap.set(dateKey, {
            date: dateKey,
            dateLabel,
            timestamp: d.getTime(),
            totalInsulin: 0,
            piCount: 0,
            glucoseSum: 0
        });
    }

    for (const data of filteredRecords) {
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

        // Daily Stats
        const rDate = new Date(data.timestamp);
        // Use ISO format to match the map keys
        const dateKey = rDate.toISOString().split('T')[0];

        if (dailyStatsMap.has(dateKey)) {
            const dayStat = dailyStatsMap.get(dateKey)!;
            dayStat.totalInsulin += data.suggested_insulin || 0;

            const glucose = data.post_glucose || data.pre_glucose;
            if (glucose) {
                dayStat.glucoseSum += glucose;
                dayStat.piCount++;
            }
        }
    }

    const dailyStats = Array.from(dailyStatsMap.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(day => ({
            date: day.date,
            dateLabel: day.dateLabel,
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
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export const resizeImage = async (base64Str: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    });
};
