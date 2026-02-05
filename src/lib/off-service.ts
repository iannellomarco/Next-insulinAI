export interface OFFProduct {
    name: string;
    carbs100g: number;
    fat100g: number;
    protein100g: number;
    brand?: string;
}

/**
 * Searches Open Food Facts for products matching the query.
 * Returns a list of products with nutritional data per 100g.
 */
export async function searchOFF(query: string): Promise<OFFProduct[]> {
    if (!query || query.length < 2) return [];

    // Use the search API
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,brands`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'InsulinAI - iOS - Version 1.0'
            }
        });

        if (!response.ok) {
            console.error('OFF API Error:', response.status);
            return [];
        }

        const data = await response.json();
        const products = data.products || [];

        return products.map((p: any) => ({
            name: p.product_name || 'Unknown',
            carbs100g: parseFloat(p.nutriments?.carbohydrates_100g) || 0,
            fat100g: parseFloat(p.nutriments?.fat_100g) || 0,
            protein100g: parseFloat(p.nutriments?.proteins_100g) || 0,
            brand: p.brands
        })).filter((p: OFFProduct) => p.carbs100g > 0 || p.fat100g > 0 || p.protein100g > 0);

    } catch (error) {
        console.error('OFF Search Failure:', error);
        return [];
    }
}
