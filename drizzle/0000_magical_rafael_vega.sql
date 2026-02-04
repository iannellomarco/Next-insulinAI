CREATE TABLE "history_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"carb_ratio" double precision,
	"carb_ratios" jsonb,
	"use_meal_specific_ratios" boolean DEFAULT false,
	"correction_factor" double precision,
	"target_glucose" integer,
	"high_threshold" integer,
	"low_threshold" integer,
	"smart_history" boolean DEFAULT true,
	"libre_username" text,
	"libre_password" text,
	"language" text DEFAULT 'en' NOT NULL,
	"meal_reminders_enabled" boolean DEFAULT false,
	"reminder_times" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
