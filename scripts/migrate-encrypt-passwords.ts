/**
 * Migration Script: Encrypt existing plaintext LibreLink passwords
 * 
 * Run with: npx tsx scripts/migrate-encrypt-passwords.ts
 * 
 * This script will:
 * 1. Fetch all user settings with non-empty librePassword
 * 2. Check if password is already encrypted (contains ':')
 * 3. Encrypt plaintext passwords with AES-256-GCM
 * 4. Update the database
 */

import { db } from '../src/db';
import { userSettings } from '../src/db/schema';
import { encryptField, isEncrypted } from '../src/lib/crypto';
import { eq, and, ne, isNotNull } from 'drizzle-orm';

async function migratePasswords() {
    console.log('🔐 Starting password encryption migration...\n');

    if (!process.env.ENCRYPTION_KEY) {
        console.error('❌ ERROR: ENCRYPTION_KEY environment variable is not set!');
        console.log('   Generate one with: openssl rand -base64 32');
        process.exit(1);
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

        console.log(`📊 Found ${users.length} users with LibreLink passwords\n`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
            const { userId, librePassword } = user;

            if (!librePassword) {
                skipped++;
                continue;
            }

            // Check if already encrypted
            if (isEncrypted(librePassword)) {
                console.log(`⏭️  User ${userId.slice(0, 8)}... already encrypted, skipping`);
                skipped++;
                continue;
            }

            try {
                // Encrypt the password
                const encryptedPassword = encryptField(librePassword);

                // Update in database
                await db
                    .update(userSettings)
                    .set({ librePassword: encryptedPassword })
                    .where(eq(userSettings.userId, userId));

                console.log(`✅ User ${userId.slice(0, 8)}... migrated successfully`);
                migrated++;
            } catch (err) {
                console.error(`❌ User ${userId.slice(0, 8)}... failed:`, err);
                errors++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('\n🎉 Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migratePasswords();
