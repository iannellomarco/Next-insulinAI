/**
 * Database Backup Script
 * Creates JSON backups of all tables before migrations
 */

import { db } from '../src/db';
import { userSettings, historyItems } from '../src/db/schema';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(process.cwd(), 'backups');
    
    // Create backups directory if it doesn't exist
    try {
        await Bun.write(join(backupDir, '.gitkeep'), '');
    } catch {
        // Directory might already exist
    }
    
    console.log('🔍 Fetching user_settings...');
    const settings = await db.select().from(userSettings);
    
    console.log('🔍 Fetching history_items...');
    const history = await db.select().from(historyItems);
    
    const backup = {
        timestamp: new Date().toISOString(),
        tables: {
            user_settings: {
                count: settings.length,
                // Remove any sensitive data from log
                sample: settings.length > 0 ? {
                    userId: settings[0].userId,
                    language: settings[0].language,
                    hasCarbRatio: !!settings[0].carbRatio,
                } : null,
                data: settings,
            },
            history_items: {
                count: history.length,
                data: history,
            },
        },
    };
    
    const filename = `backup_${timestamp}.json`;
    const filepath = join(backupDir, filename);
    
    writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    console.log('\n✅ Backup completed!');
    console.log(`📁 File: ${filepath}`);
    console.log(`👥 User settings: ${settings.length} rows`);
    console.log(`📜 History items: ${history.length} rows`);
    
    // Also create SQL schema backup
    const schemaBackup = `-- Schema Backup - ${new Date().toISOString()}
-- Run this to verify current schema before migration

-- Current user_settings columns:
${Object.keys(settings[0] || {}).map(col => `--   - ${col}`).join('\n') || '--   (no data)'}

-- Row count verification:
-- user_settings: ${settings.length} rows
-- history_items: ${history.length} rows
`;
    
    const schemaFilename = `schema_backup_${timestamp}.sql`;
    const schemaPath = join(backupDir, schemaFilename);
    writeFileSync(schemaPath, schemaBackup);
    
    console.log(`📋 Schema: ${schemaPath}`);
}

backup().catch(err => {
    console.error('❌ Backup failed:', err);
    process.exit(1);
});
