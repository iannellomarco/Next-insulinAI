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
    actual_insulin?: number; // User override
    post_glucose?: number; // 2h check
}

export interface Settings {
    apiKey: string;
    carbRatio: number;
    correctionFactor: number;
    targetGlucose: number;
    highThreshold: number;
    lowThreshold: number;
    smartHistory: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    carbRatio: 10,
    correctionFactor: 50,
    targetGlucose: 110,
    highThreshold: 180,
    lowThreshold: 70,
    smartHistory: true,
};

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

