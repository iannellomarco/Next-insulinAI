import { pgTable, serial, text, timestamp, jsonb, boolean, integer, doublePrecision, index, unique } from 'drizzle-orm/pg-core';

// Cookbook Items Table (for iOS Cookbook feature sync)
export const cookbookItems = pgTable('cookbook_items', {
    id: text('id').primaryKey(), // UUID from iOS
    userId: text('user_id').notNull(), // Clerk User ID
    name: text('name').notNull(),
    icon: text('icon').default('🍽️'),
    category: text('category').default('Other'), // Breakfast, Lunch, Dinner, Snack, Dessert, Beverage, Other
    carbsPerServing: doublePrecision('carbs_per_serving').notNull(),
    fatPerServing: doublePrecision('fat_per_serving').notNull(),
    proteinPerServing: doublePrecision('protein_per_serving').notNull(),
    caloriesPerServing: doublePrecision('calories_per_serving'),
    servingSize: text('serving_size').notNull(), // e.g., "100g", "1 piece"
    servingDescription: text('serving_description').default('1 serving'), // e.g., "1 medium slice"
    source: text('source').default('manual'), // manual, ai_scan, history
    originalHistoryItemId: text('original_history_item_id'), // Reference if saved from history
    notes: text('notes'),
    isVerified: boolean('is_verified').default(true),
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// History Items Table
export const historyItems = pgTable('history_items', {
    id: text('id').primaryKey(), // We'll use the timestamp string ID from local state or UUID
    userId: text('user_id').notNull(), // Clerk User ID
    timestamp: timestamp('timestamp').notNull(),
    data: jsonb('data').notNull(), // Store the full HistoryItem object
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Settings Table
// NOTE: Libre/Dexcom credentials are stored in iOS Keychain, not in this table
export const userSettings = pgTable('user_settings', {
    userId: text('user_id').primaryKey(), // Clerk User ID is the PK
    carbRatio: doublePrecision('carb_ratio'),
    carbRatios: jsonb('carb_ratios'), // { breakfast: number, lunch: number, dinner: number }
    useMealSpecificRatios: boolean('use_meal_specific_ratios').default(false),
    correctionFactor: doublePrecision('correction_factor'),
    targetGlucose: integer('target_glucose'),
    highThreshold: integer('high_threshold'),
    lowThreshold: integer('low_threshold'),

    smartHistory: boolean('smart_history').default(true),
    // Credentials removed - stored in iOS Keychain via SecureCredentialsService
    // libreUsername: text('libre_username'), // REMOVED
    // librePassword: text('libre_password'), // REMOVED
    // dexcomUsername: text('dexcom_username'), // REMOVED
    // dexcomPassword: text('dexcom_password'), // REMOVED
    // dexcomRegion: text('dexcom_region'), // REMOVED - not used server-side
    language: text('language').default('en').notNull(),
    analysisMode: text('analysis_mode').default('pplx_only').notNull(),
    aiProvider: text('ai_provider').default('perplexity').notNull(), // 'perplexity' or 'openai'
    mealRemindersEnabled: boolean('meal_reminders_enabled').default(false),
    splitBolusReminderEnabled: boolean('split_bolus_reminder_enabled').default(true),
    medicalParamsConfigured: boolean('medical_params_configured').default(false),
    isLegacyPro: boolean('is_legacy_pro').default(false), // Grandfathered users
    reminderTimes: jsonb('reminder_times'), // { breakfast: number, lunch: number, dinner: number }
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Glucose Readings Table
export const glucoseReadings = pgTable('glucose_readings', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    value: integer('value').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    trendType: text('trend_type').notNull(),
    isHigh: boolean('is_high').default(false),
    isLow: boolean('is_low').default(false),
    source: text('source').default('libre'),
    dayKey: text('day_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        userIdTimestampIdx: index('idx_glucose_readings_user_date').on(table.userId, table.timestamp),
        userIdIdUnique: unique('user_id_id_unique').on(table.userId, table.id),
    };
});
