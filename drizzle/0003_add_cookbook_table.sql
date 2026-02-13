-- Migration: Add cookbook_items table for iOS Cookbook feature sync
-- Date: 2026-02-13

CREATE TABLE IF NOT EXISTS "cookbook_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '🍽️',
	"category" text DEFAULT 'Other',
	"carbs_per_serving" double precision NOT NULL,
	"fat_per_serving" double precision NOT NULL,
	"protein_per_serving" double precision NOT NULL,
	"calories_per_serving" double precision,
	"serving_size" text NOT NULL,
	"serving_description" text DEFAULT '1 serving',
	"source" text DEFAULT 'manual',
	"original_history_item_id" text,
	"notes" text,
	"is_verified" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS "cookbook_user_id_idx" ON "cookbook_items" ("user_id");

-- Index for category filtering
CREATE INDEX IF NOT EXISTS "cookbook_category_idx" ON "cookbook_items" ("category");
