import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('POSTGRES_URL not found in .env.local');
    process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function manualMigrate() {
    try {
        console.log('Starting manual migration...');

        // 1. Drop plaintext password columns
        console.log('Dropping password columns...');
        await db.execute(sql`
            ALTER TABLE "user_settings" 
            DROP COLUMN IF EXISTS "libre_password",
            DROP COLUMN IF EXISTS "libre_username",
            DROP COLUMN IF EXISTS "dexcom_password",
            DROP COLUMN IF EXISTS "dexcom_username";
        `);
        console.log('Password columns dropped (if they existed).');

        // 2. Create cookbook_items table
        console.log('Creating cookbook_items table...');
        await db.execute(sql`
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
        `);
        console.log('cookbook_items table created (if it didn\'t exist).');

        // 3. Create indexes
        console.log('Creating indexes...');
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "cookbook_user_id_idx" ON "cookbook_items" ("user_id");`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "cookbook_category_idx" ON "cookbook_items" ("category");`);
        console.log('Indexes created.');

        console.log('Manual migration completed successfully.');

    } catch (error) {
        console.error('Manual migration failed:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

manualMigrate();
