// Node 24 has built-in fetch

async function searchOFF(query) {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,brands`;
    const response = await fetch(url, { headers: { 'User-Agent': 'InsulinAI-Debug' } });
    const data = await response.json();
    return (data.products || []).map(p => ({
        name: p.product_name || 'Unknown',
        carbs100g: p.nutriments?.carbohydrates_100g || 0,
        fat100g: p.nutriments?.fat_100g || 0,
        protein100g: p.nutriments?.proteins_100g || 0,
        brand: p.brands
    })).filter(p => p.carbs100g > 0 || p.fat100g > 0 || p.protein100g > 0);
}

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
        if (!p.brand || p.brand.toLowerCase() === 'unknown' || p.brand.toLowerCase() === 'generic' || p.brand.trim() === '') {
            score += 40; // Increased priority
        }

        // 5. Shortness preference
        score -= p.name.length / 2;

        // 6. Penalty for "yogurt" or "yogur" if query doesn't have it
        if (!queryLower.includes('yogur') && nameLower.includes('yogur')) {
            score -= 60;
        }

        return { product: p, score };
    });

    const sorted = scoredProducts.sort((a, b) => b.score - a.score);

    sorted.forEach((item, i) => {
        console.log(`${i + 1}. [Score: ${item.score.toFixed(1)}] ${item.product.name} (${item.product.brand || 'No brand'}) - Carbs: ${item.product.carbs100g}`);
    });
}

test();
