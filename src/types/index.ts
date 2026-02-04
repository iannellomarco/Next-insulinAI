export interface FoodItem {
    id?: string;
    name: string;
    carbs: number;
    fat: number;
    protein: number;
    approx_weight?: string;
}

export interface SplitBolusRecommendation {
    recommended: boolean;
    split_percentage?: string;
    duration?: string;
    reason?: string;
}

export interface AnalysisResult {
    friendly_description: string;
    food_items: FoodItem[];
    total_carbs: number;
    total_fat: number;
    total_protein: number;
    suggested_insulin: number;
    split_bolus_recommendation: SplitBolusRecommendation;
    reasoning: string | string[];
    warnings?: string[];
}

export interface HistoryItem extends AnalysisResult {
    id: string;
    timestamp: number;
    actual_insulin?: number; // User override - what they actually took
    pre_glucose?: number; // Glucose at meal time
    post_glucose?: number; // 2h check
    chainId?: string; // Groups multiple items eaten together
    chainIndex?: number; // Order within the chain (0 = first item)
    split_bolus_accepted?: boolean; // Whether user accepted split bolus recommendation
    meal_period?: MealPeriod; // Which meal period this was logged in
}

export interface CarbRatios {
    breakfast: number;
    lunch: number;
    dinner: number;
}

export interface ReminderTimes {
    breakfast: number; // timestamp or ISO string? Let's use string for simpler JSON handling if needed, or number.
    lunch: number;
    dinner: number;
}

export interface Settings {
    apiKey: string;
    carbRatio: number; // Legacy single ratio (used as fallback)
    carbRatios: CarbRatios; // Per-meal ratios
    useMealSpecificRatios: boolean; // Toggle for using meal-specific ratios
    correctionFactor: number;
    targetGlucose: number;
    highThreshold: number;
    lowThreshold: number;
    smartHistory: boolean;
    libreUsername?: string;
    librePassword?: string;
    language: 'en' | 'it';
    mealRemindersEnabled: boolean;
    reminderTimes: ReminderTimes;
}

export const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    carbRatio: 10,
    carbRatios: {
        breakfast: 8,
        lunch: 10,
        dinner: 12,
    },
    useMealSpecificRatios: false,
    correctionFactor: 50,
    targetGlucose: 110,
    highThreshold: 180,
    lowThreshold: 70,
    smartHistory: true,
    libreUsername: '',
    librePassword: '',
    language: 'en',
    mealRemindersEnabled: false,
    reminderTimes: {
        breakfast: new Date().setHours(8, 30, 0, 0),
        lunch: new Date().setHours(12, 30, 0, 0),
        dinner: new Date().setHours(19, 30, 0, 0),
    }
};

// Helper to get current meal period
export type MealPeriod = 'breakfast' | 'lunch' | 'dinner';

export function getCurrentMealPeriod(): MealPeriod {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    return 'dinner';
}

export function getCarbRatioForCurrentMeal(settings: Settings): number {
    if (!settings.useMealSpecificRatios) return settings.carbRatio;
    const period = getCurrentMealPeriod();
    return settings.carbRatios[period];
}

export type TimeBucket = 'morning' | 'lunch' | 'afternoon' | 'dinner';

export interface Favorite {
    id: string;
    name: string;
    icon: string;
    carbs: number;
    fat?: number;
    protein?: number;
    isAutoSuggested: boolean;
    timeBucket?: TimeBucket;
    frequency: number;
}

