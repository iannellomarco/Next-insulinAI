import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../src/db';
import { historyItems } from '../src/db/schema';
import { count } from 'drizzle-orm';

async function checkHistory() {
    try {
        const result = await db.select({ count: count() }).from(historyItems);
        console.log('Total history items in DB:', result[0].count);

        const sample = await db.select().from(historyItems).limit(1);
        if (sample.length > 0) {
            console.log('Sample item:', JSON.stringify(sample[0], null, 2));
        } else {
            console.log('No items found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking history:', error);
        process.exit(1);
    }
}

checkHistory();
