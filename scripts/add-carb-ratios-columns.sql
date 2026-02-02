-- Migration: Add carb_ratios and use_meal_specific_ratios columns to user_settings
-- Run this script to add support for per-meal carb ratios

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS carb_ratios JSONB DEFAULT '{"breakfast": 8, "lunch": 10, "dinner": 12}'::jsonb;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS use_meal_specific_ratios BOOLEAN DEFAULT false;
