import { HistoryItem, Favorite, TimeBucket } from '@/types';

const FREQUENCY_THRESHOLD = 3; // Foods eaten 3+ times become favorites

/**
 * Get the time bucket for a given hour
 */
export function getTimeBucket(hour: number): TimeBucket {
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'afternoon';
    return 'dinner'; // 6PM - 10PM and late night
}

/**
 * Get icon emoji based on food name
 */
export function getFoodIcon(name: string): string {
    const lower = name.toLowerCase();

    // Breakfast
    if (lower.includes('oat') || lower.includes('cereal') || lower.includes('porridge')) return '🥣';
    if (lower.includes('egg')) return '🍳';
    if (lower.includes('pancake') || lower.includes('waffle')) return '🥞';
    if (lower.includes('toast') || lower.includes('bread')) return '🍞';
    if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('latte')) return '☕';

    // Fruits
    if (lower.includes('apple')) return '🍎';
    if (lower.includes('banana')) return '🍌';
    if (lower.includes('orange')) return '🍊';
    if (lower.includes('grape')) return '🍇';
    if (lower.includes('strawberr')) return '🍓';
    if (lower.includes('watermelon')) return '🍉';

    // Main dishes
    if (lower.includes('pizza')) return '🍕';
    if (lower.includes('burger')) return '🍔';
    if (lower.includes('sandwich')) return '🥪';
    if (lower.includes('pasta') || lower.includes('spaghetti')) return '🍝';
    if (lower.includes('rice')) return '🍚';
    if (lower.includes('sushi')) return '🍣';
    if (lower.includes('taco')) return '🌮';
    if (lower.includes('salad')) return '🥗';
    if (lower.includes('soup')) return '🍲';
    if (lower.includes('chicken')) return '🍗';
    if (lower.includes('steak') || lower.includes('beef')) return '🥩';
    if (lower.includes('fish') || lower.includes('salmon')) return '🐟';

    // Snacks & Desserts
    if (lower.includes('cookie')) return '🍪';
    if (lower.includes('cake')) return '🍰';
    if (lower.includes('ice cream') || lower.includes('gelato')) return '🍦';
    if (lower.includes('chocolate')) return '🍫';
    if (lower.includes('donut')) return '🍩';
    if (lower.includes('candy')) return '🍬';
    if (lower.includes('popcorn')) return '🍿';
    if (lower.includes('fries') || lower.includes('chips')) return '🍟';

    // Drinks
    if (lower.includes('tea')) return '🍵';
    if (lower.includes('juice')) return '🧃';
    if (lower.includes('milk')) return '🥛';
    if (lower.includes('smoothie')) return '🥤';

    // Default
    return '🍽️';
}

/**
 * Normalize food name for comparison
 */
function normalizeFoodName(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/**
 * Check if two food names are similar
 */
function areSimilarFoods(name1: string, name2: string): boolean {
    const n1 = normalizeFoodName(name1);
    const n2 = normalizeFoodName(name2);

    // Exact match
    if (n1 === n2) return true;

    // One contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Split into words and check overlap
    const words1 = n1.split(' ').filter(w => w.length > 2);
    const words2 = n2.split(' ').filter(w => w.length > 2);
    const overlap = words1.filter(w => words2.includes(w));

    return overlap.length >= 1 && overlap.length >= Math.min(words1.length, words2.length) * 0.5;
}

interface FoodFrequency {
    name: string;
    count: number;
    totalCarbs: number;
    totalFat: number;
    totalProtein: number;
    timeBuckets: Record<TimeBucket, number>;
    lastEaten: number;
}

/**
 * Analyze history to find frequently eaten foods
 */
export function analyzeHistoryForFavorites(history: HistoryItem[]): Favorite[] {
    const frequencyMap: Map<string, FoodFrequency> = new Map();

    // Process each history item
    for (const item of history) {
        const hour = new Date(item.timestamp).getHours();
        const timeBucket = getTimeBucket(hour);

        // Get the main food name
        const mainFood = item.food_items?.[0]?.name ||
            item.friendly_description?.split(',')[0]?.trim() ||
            'Unknown';

        const normalizedName = normalizeFoodName(mainFood);

        // Find existing entry or create new
        let existingKey: string | null = null;
        for (const [key] of frequencyMap) {
            if (areSimilarFoods(key, normalizedName)) {
                existingKey = key;
                break;
            }
        }

        if (existingKey) {
            const existing = frequencyMap.get(existingKey)!;
            existing.count++;
            existing.totalCarbs += item.total_carbs || 0;
            existing.totalFat += item.total_fat || 0;
            existing.totalProtein += item.total_protein || 0;
            existing.timeBuckets[timeBucket]++;
            if (item.timestamp > existing.lastEaten) {
                existing.lastEaten = item.timestamp;
                existing.name = mainFood; // Use most recent name format
            }
        } else {
            frequencyMap.set(normalizedName, {
                name: mainFood,
                count: 1,
                totalCarbs: item.total_carbs || 0,
                totalFat: item.total_fat || 0,
                totalProtein: item.total_protein || 0,
                timeBuckets: { morning: 0, lunch: 0, afternoon: 0, dinner: 0, [timeBucket]: 1 },
                lastEaten: item.timestamp,
            });
        }
    }

    // Convert to favorites (only those meeting threshold)
    const favorites: Favorite[] = [];

    for (const [, data] of frequencyMap) {
        if (data.count >= FREQUENCY_THRESHOLD) {
            // Find dominant time bucket
            const dominantBucket = (Object.entries(data.timeBuckets) as [TimeBucket, number][])
                .sort((a, b) => b[1] - a[1])[0][0];

            favorites.push({
                id: `auto-${normalizeFoodName(data.name)}`,
                name: data.name,
                icon: getFoodIcon(data.name),
                carbs: Math.round(data.totalCarbs / data.count),
                fat: Math.round(data.totalFat / data.count),
                protein: Math.round(data.totalProtein / data.count),
                isAutoSuggested: true,
                timeBucket: dominantBucket,
                frequency: data.count,
            });
        }
    }

    // Sort by frequency (most frequent first)
    return favorites.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get favorites relevant to the current time of day
 */
export function getTimeRelevantFavorites(favorites: Favorite[], currentHour?: number): Favorite[] {
    const hour = currentHour ?? new Date().getHours();
    const currentBucket = getTimeBucket(hour);

    // Sort: current time bucket first, then by frequency
    return [...favorites].sort((a, b) => {
        const aRelevant = a.timeBucket === currentBucket ? 1 : 0;
        const bRelevant = b.timeBucket === currentBucket ? 1 : 0;

        if (aRelevant !== bRelevant) return bRelevant - aRelevant;
        return b.frequency - a.frequency;
    });
}

/**
 * Check if a food should be suggested as a new favorite
 */
export function shouldSuggestAsNew(
    foodName: string,
    history: HistoryItem[],
    existingFavorites: Favorite[]
): boolean {
    const normalized = normalizeFoodName(foodName);

    // Check if already a favorite
    if (existingFavorites.some(f => areSimilarFoods(normalizeFoodName(f.name), normalized))) {
        return false;
    }

    // Count occurrences in history
    let count = 0;
    for (const item of history) {
        const mainFood = item.food_items?.[0]?.name || item.friendly_description?.split(',')[0] || '';
        if (areSimilarFoods(normalizeFoodName(mainFood), normalized)) {
            count++;
        }
    }

    return count >= FREQUENCY_THRESHOLD;
}

/**
 * Create a favorite from a history item
 */
export function createFavoriteFromHistory(item: HistoryItem): Favorite {
    const mainFood = item.food_items?.[0]?.name ||
        item.friendly_description?.split(',')[0]?.trim() ||
        'Food';

    const hour = new Date(item.timestamp).getHours();

    return {
        id: `fav-${Date.now()}`,
        name: mainFood,
        icon: getFoodIcon(mainFood),
        carbs: item.total_carbs,
        fat: item.total_fat,
        protein: item.total_protein,
        isAutoSuggested: false,
        timeBucket: getTimeBucket(hour),
        frequency: 1,
    };
}
