import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { glucoseReadings } from '@/db/schema';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

// GET /api/mobile/glucose-readings?from=...&to=...
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!from || !to) {
            return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
        }

        const readings = await db.query.glucoseReadings.findMany({
            where: and(
                eq(glucoseReadings.userId, userId),
                gte(glucoseReadings.timestamp, new Date(from)),
                lte(glucoseReadings.timestamp, new Date(to))
            ),
            orderBy: desc(glucoseReadings.timestamp),
        });

        return NextResponse.json(readings);
    } catch (error) {
        console.error('[Glucose API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/mobile/glucose-readings
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const readings = await req.json();

        if (!Array.isArray(readings) || readings.length === 0) {
            return NextResponse.json({ error: 'Invalid readings data' }, { status: 400 });
        }

        // Use upsert to handle duplicates (idempotent)
        // Drizzle upsert: 
        // .values({...})
        // .onConflictDoUpdate({ target: [table.userId, table.id], set: { ... } })

        // We can use Promise.all for batch upserts or a single query if supported.
        // Drizzle supports inserting multiple rows, but onConflictDoUpdate might be tricky with different values for each row in a single query if the driver doesn't support it well, but Postgres does.
        // However, `values` accepts an array.
        // But `onConflictDoUpdate` strict syntax usually sets columns to `excluded.column`.
        // Drizzle 0.30+ supports `set` with `sql`.

        // Let's iterate for safety and simplicity as per original plan, or batch if possible.
        // The original plan used Promise.all with prisma.upsert.
        // Drizzle `insert(...).values(readings).onConflictDoUpdate(...)` works for batch upsert where updated values come from the 'excluded' row.
        // But let's check if Drizzle supports `excluded` in `set`.
        // Yes, using `sql` operator.

        // Define interface for input reading
        interface InputReading {
            id: string;
            value: number;
            timestamp: string | Date;
            trendType: string;
            isHigh: boolean;
            isLow: boolean;
            source?: string;
            dayKey: string;
        }

        const valuesToInsert = readings.map((reading: InputReading) => ({
            id: reading.id,
            userId,
            value: reading.value,
            timestamp: new Date(reading.timestamp),
            trendType: reading.trendType,
            isHigh: reading.isHigh,
            isLow: reading.isLow,
            source: reading.source || 'libre',
            dayKey: reading.dayKey,
            createdAt: new Date(), // Set created_at for new records
        }));

        await db.insert(glucoseReadings)
            .values(valuesToInsert)
            .onConflictDoUpdate({
                target: [glucoseReadings.userId, glucoseReadings.id], // Assuming unique constraint is on (userId, id)
                set: {
                    value: sql`excluded.value`,
                    trendType: sql`excluded.trend_type`,
                    isHigh: sql`excluded.is_high`,
                    isLow: sql`excluded.is_low`,
                    // dayKey: sql`excluded.day_key`, // Should be same
                    // timestamp: sql`excluded.timestamp`, // Should be same
                    // source: sql`excluded.source`, 
                }
            });

        return NextResponse.json({ synced: readings.length });
    } catch (error) {
        console.error('[Glucose API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
