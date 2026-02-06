import { searchOFF } from './src/lib/off-service';

async function test() {
    const query = "banana";
    console.log(`Testing query: "${query}"`);

    const products = await searchOFF(query);
    console.log(`Found ${products.length} products.\n`);

    const queryLower = query.toLowerCase().trim();
    const scoredProducts = products.map(p => {
        let score = 0;
        const nameLower = p.name.toLowerCase();

        // 1. Exact match (highest priority)
        if (nameLower === queryLower) score += 100;

        // 2. Starts with query
        else if (nameLower.startsWith(queryLower)) score += 50;

        // 3. Contains query
        else if (nameLower.includes(queryLower)) score += 20;

        // 4. Generic preference (no brand or "Unknown" brand)
        if (!p.brand || p.brand.toLowerCase() === 'unknown' || p.brand.toLowerCase() === 'generic') {
            score += 30;
        }

        // 5. Shortness preference (favor "Banana" over "Banana and Strawberry Yogurt")
        score -= p.name.length / 2;

        return { product: p, score };
    });

    const sorted = scoredProducts.sort((a, b) => b.score - a.score);

    sorted.forEach((item, i) => {
        console.log(`${i + 1}. [Score: ${item.score.toFixed(1)}] ${item.product.name} (${item.product.brand || 'No brand'}) - Carbs: ${item.product.carbs100g}`);
    });
}

test();
