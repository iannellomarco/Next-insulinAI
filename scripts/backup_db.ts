import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
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

// Disable prefetch to avoid hanging connection
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function backup() {
    try {
        console.log('Starting backup...');

        // Backup user_settings
        console.log('Backing up user_settings...');
        // Use raw SQL to get all columns including legacy passwords
        const userSettings = await db.execute(sql`SELECT * FROM user_settings`);
        console.log(`Backed up ${userSettings.length} user settings.`);

        // Backup history_items
        console.log('Backing up history_items...');
        const historyItems = await db.execute(sql`SELECT * FROM history_items`);
        console.log(`Backed up ${historyItems.length} history items.`);

        // Backup cookbook_items
        console.log('Backing up cookbook_items...');
        let cookbookItems = [];
        try {
            cookbookItems = await db.execute(sql`SELECT * FROM cookbook_items`);
            console.log(`Backed up ${cookbookItems.length} cookbook items.`);
        } catch (e) {
            console.log('Cookbook table likely does not exist yet. Skipping.');
        }

        const backupData = {
            timestamp: new Date().toISOString(),
            userSettings: userSettings,
            historyItems: historyItems,
            cookbookItems: cookbookItems
        };

        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const filename = `backup_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        console.log(`Backup saved to ${filepath}`);

    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await client.end();
        process.exit(0);
    }
}

backup();
