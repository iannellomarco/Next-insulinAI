import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { historyItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all history items for the authenticated user
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await db.select()
            .from(historyItems)
            .where(eq(historyItems.userId, userId))
            .orderBy(desc(historyItems.timestamp));

        return NextResponse.json(results.map(r => r.data));
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

// POST: Sync a history item
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const item = await request.json();

        await db.insert(historyItems).values({
            id: item.id,
            userId,
            timestamp: new Date(item.timestamp),
            data: item,
        }).onConflictDoUpdate({
            target: historyItems.id,
            set: {
                data: item,
                timestamp: new Date(item.timestamp)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to sync history:', error);
        return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
    }
}

// DELETE: Delete a history item
export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        await db.delete(historyItems).where(eq(historyItems.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete history:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
