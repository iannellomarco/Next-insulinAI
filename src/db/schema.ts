import { pgTable, serial, text, timestamp, jsonb, boolean, integer, doublePrecision } from 'drizzle-orm/pg-core';

// History Items Table
export const historyItems = pgTable('history_items', {
    id: text('id').primaryKey(), // We'll use the timestamp string ID from local state or UUID
    userId: text('user_id').notNull(), // Clerk User ID
    timestamp: timestamp('timestamp').notNull(),
    data: jsonb('data').notNull(), // Store the full HistoryItem object
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Settings Table
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
    libreUsername: text('libre_username'),
    librePassword: text('libre_password'),
    dexcomUsername: text('dexcom_username'),
    dexcomPassword: text('dexcom_password'),
    dexcomRegion: text('dexcom_region'),
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
