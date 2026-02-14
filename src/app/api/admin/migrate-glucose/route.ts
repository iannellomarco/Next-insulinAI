// Temporary admin endpoint to migrate glucose reading IDs
// DELETE THIS FILE AFTER MIGRATION!

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        
        // Only allow authenticated users to run this
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔧 Starting glucose ID migration...\n');
        
        // Step 1: Count before
        const before = await db.execute(sql`SELECT COUNT(*) as count FROM glucose_readings`);
        const beforeCount = before[0].count;
        console.log(`📊 Before: ${beforeCount} readings\n`);
        
        // Step 2: Create temp table
        await db.execute(sql`
            CREATE TEMP TABLE IF NOT EXISTS temp_migrate AS
            SELECT 
                user_id,
                FLOOR(EXTRACT(EPOCH FROM timestamp) / 60) * 60 as new_id,
                value, timestamp, trend_type, is_high, is_low, source, day_key, created_at
            FROM glucose_readings
        `);
        
        // Step 3: Count duplicates
        const dupes = await db.execute(sql`
            SELECT COUNT(*) as count FROM (
                SELECT user_id, new_id FROM temp_migrate 
                GROUP BY user_id, new_id HAVING COUNT(*) > 1
            ) x
        `);
        const dupeCount = dupes[0].count;
        
        // Step 4: Clear and re-insert
        await db.execute(sql`DELETE FROM glucose_readings`);
        
        await db.execute(sql`
            INSERT INTO glucose_readings (id, user_id, value, timestamp, trend_type, is_high, is_low, source, day_key, created_at)
            SELECT DISTINCT ON (user_id, new_id)
                new_id::text as id, user_id, value, timestamp, trend_type, is_high, is_low, source, day_key, created_at
            FROM temp_migrate
            ORDER BY user_id, new_id, timestamp DESC
        `);
        
        // Step 5: Cleanup
        await db.execute(sql`DROP TABLE IF EXISTS temp_migrate`);
        
        // Step 6: Count after
        const after = await db.execute(sql`SELECT COUNT(*) as count FROM glucose_readings`);
        const afterCount = after[0].count;
        
        console.log(`✅ Migration complete!`);
        console.log(`Before: ${beforeCount}, After: ${afterCount}, Removed: ${beforeCount - afterCount}`);
        
        return NextResponse.json({
            success: true,
            before: beforeCount,
            after: afterCount,
            duplicatesMerged: dupeCount,
            removed: beforeCount - afterCount
        });
        
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ 
            error: 'Migration failed', 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
