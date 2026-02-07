import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { encryptField, isEncrypted } from '@/lib/crypto';
import { and, ne, isNotNull } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

// TEMPORARY: Migration endpoint - DELETE AFTER USE
// GET /api/admin/migrate-passwords?secret=YOUR_SECRET
export async function GET(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');

    // Simple auth check
    if (secret !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.ENCRYPTION_KEY) {
        return NextResponse.json({ error: 'ENCRYPTION_KEY not set' }, { status: 500 });
    }

    try {
        // Fetch all users with non-empty librePassword
        const users = await db
            .select({
                userId: userSettings.userId,
                librePassword: userSettings.librePassword,
            })
            .from(userSettings)
            .where(
                and(
                    isNotNull(userSettings.librePassword),
                    ne(userSettings.librePassword, '')
                )
            );

        let migrated = 0;
        let skipped = 0;
        const results: string[] = [];

        for (const user of users) {
            const { userId, librePassword } = user;

            if (!librePassword) {
                skipped++;
                continue;
            }

            if (isEncrypted(librePassword)) {
                results.push(`⏭️ ${userId.slice(0, 8)}... already encrypted`);
                skipped++;
                continue;
            }

            try {
                const encryptedPassword = encryptField(librePassword);
                await db
                    .update(userSettings)
                    .set({ librePassword: encryptedPassword })
                    .where(eq(userSettings.userId, userId));

                results.push(`✅ ${userId.slice(0, 8)}... migrated`);
                migrated++;
            } catch (e) {
                results.push(`❌ ${userId.slice(0, 8)}... failed`);
            }
        }

        return NextResponse.json({
            success: true,
            total: users.length,
            migrated,
            skipped,
            results
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
