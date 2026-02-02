-- Migration to add language column to user_settings table
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en' NOT NULL;
