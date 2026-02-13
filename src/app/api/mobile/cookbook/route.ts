import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { cookbookItems } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all cookbook items for the authenticated user
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await db.select()
            .from(cookbookItems)
            .where(eq(cookbookItems.userId, userId))
            .orderBy(desc(cookbookItems.updatedAt));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Failed to fetch cookbook:', error);
        return NextResponse.json({ error: 'Failed to fetch cookbook' }, { status: 500 });
    }
}

// POST: Sync (Create/Update) a cookbook item
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const item = await request.json();

        // Ensure the ID and UserID match the request contexts
        // If it's a new item, item.id should be provided by client (UUID)
        if (!item.id) {
            return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
        }

        await db.insert(cookbookItems).values({
            id: item.id,
            userId,
            name: item.name,
            icon: item.icon ?? '🍽️',
            category: item.category ?? 'Other',
            carbsPerServing: item.carbsPerServing,
            fatPerServing: item.fatPerServing,
            proteinPerServing: item.proteinPerServing,
            caloriesPerServing: item.caloriesPerServing,
            servingSize: item.servingSize,
            servingDescription: item.servingDescription,
            source: item.source,
            originalHistoryItemId: item.originalHistoryItemId,
            notes: item.notes,
            isVerified: item.isVerified ?? true,
            usageCount: item.usageCount ?? 0,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: new Date(), // Always update timestamp on sync
        }).onConflictDoUpdate({
            target: cookbookItems.id,
            set: {
                name: item.name,
                icon: item.icon,
                category: item.category,
                carbsPerServing: item.carbsPerServing,
                fatPerServing: item.fatPerServing,
                proteinPerServing: item.proteinPerServing,
                caloriesPerServing: item.caloriesPerServing,
                servingSize: item.servingSize,
                servingDescription: item.servingDescription,
                source: item.source,
                notes: item.notes,
                isVerified: item.isVerified,
                usageCount: item.usageCount,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to sync cookbook item:', error);
        return NextResponse.json({ error: 'Failed to sync item' }, { status: 500 });
    }
}

// DELETE: Delete a cookbook item
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

        const deleted = await db.delete(cookbookItems)
            .where(and(eq(cookbookItems.id, id), eq(cookbookItems.userId, userId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete cookbook item:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
