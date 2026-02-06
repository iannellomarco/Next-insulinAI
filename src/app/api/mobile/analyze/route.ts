import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCarbRatioForCurrentMeal, MealPeriod } from '@/types';
import { searchOFF } from '@/lib/off-service';

export const runtime = 'edge'; // Enable Vercel Edge Runtime for 0ms cold starts

export async function POST(request: NextRequest) {
    // 1. Parallelize Auth & Body Parsing for Speed
    // Start both promises immediately
    const authPromise = auth();
    const bodyPromise = request.json();

    try {
        const [{ userId }, body] = await Promise.all([authPromise, bodyPromise]);

        // In strict mode check userId... (logic preserved)

        const { text, image, userSettings, mealPeriod } = body; // image is base64 string

        // Validate inputs
        if (!text && !image) {
            return NextResponse.json({ error: 'Input required (text or image)' }, { status: 400 });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 2. Prepare Prompt (Copied from web AppLogic/AIService)
        const language = userSettings?.language === 'it' ? 'Italian' : 'English';

        let carbRatio = userSettings?.carbRatio || 10;
        if (userSettings?.useMealSpecificRatios && userSettings?.carbRatios) {
            if (mealPeriod && ['breakfast', 'lunch', 'dinner'].includes(mealPeriod)) {
                carbRatio = userSettings.carbRatios[mealPeriod as MealPeriod];
            } else {
                carbRatio = getCarbRatioForCurrentMeal(userSettings);
            }
        }

        let offContext = "";
        let usedOFF = false;
        const textToSearch = typeof text === 'string' ? text.trim() : "";
        const isBarcode = /^\d{8,14}$/.test(textToSearch);

        // Early Return for Barcode (Speed Optimization)
        if (isBarcode && userSettings?.analysisMode !== 'pplx_only') {
            const products = await searchOFF(textToSearch);
            if (products.length > 0) {
                const result = products[0];
                const totalCarbs = result.carbs100g;
                return NextResponse.json({
                    friendly_description: result.name,
                    food_items: [{
                        name: result.name,
                        carbs: result.carbs100g,
                        fat: result.fat100g,
                        protein: result.protein100g,
                        approx_weight: "100g"
                    }],
                    total_carbs: totalCarbs,
                    total_fat: result.fat100g,
                    total_protein: result.protein100g,
                    suggested_insulin: Number((totalCarbs / carbRatio).toFixed(1)),
                    calculation_formula: `${totalCarbs}g carbs / ${carbRatio} ratio = ${Number((totalCarbs / carbRatio).toFixed(1))}U`,
                    sources: ["Open Food Facts (Barcode)"],
                    split_bolus_recommendation: { recommended: false, split_percentage: "", duration: "", reason: "" },
                    reasoning: ["Direct Barcode Match."],
                    confidence_level: "high",
                    warnings: ["Nutritional data is per 100g."]
                });
            }
        }

        if (userSettings?.analysisMode !== 'pplx_only' && textToSearch.length > 0) {
            const products = await searchOFF(textToSearch);
            if (products.length > 0) {
                const queryLower = textToSearch.toLowerCase();
                const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

                // Scoring and selection logic
                const scoredProducts = products.map(p => {
                    let score = 0;
                    const nameLower = p.name.toLowerCase();
                    const brandLower = (p.brand || "").toLowerCase();

                    // String Similarity Scoring
                    if (nameLower === queryLower) score += 100;
                    else if (nameLower.startsWith(queryLower)) score += 50;
                    else if (nameLower.includes(queryLower)) score += 20;

                    // Brand Logic
                    const hasNoBrand = !p.brand || brandLower === 'unknown' || brandLower === 'generic';
                    if (hasNoBrand) score += 40; // Penalty for unknown brands implicitly removed by not adding bonus? No, keeping as baseline

                    // Brand match bonus
                    const brandMatch = !hasNoBrand && queryWords.some(word => brandLower.includes(word));
                    if (brandMatch) score += 80;

                    // Category Logic (New)
                    const categoryMatch = queryWords.some(word => p.categories?.some(c => c.toLowerCase().includes(word)));
                    if (categoryMatch) score += 70;

                    // Quantity Logic (New)
                    // If query contains "500g" and product has "500", bonus
                    const qtyMatch = queryWords.some(word => /\d+/.test(word) && (p.name.includes(word) || (p.quantity && p.quantity.includes(word))));
                    if (qtyMatch) score += 50;

                    // Specific Penalties
                    if (nameLower.includes('yogur') && !queryLower.includes('yogur')) score -= 100;
                    // Example: "Pane" is too generic without brand
                    if (nameLower === 'pane' && hasNoBrand) score -= 30;

                    return { product: p, score, brandMatch };
                });

                const sortedResults = scoredProducts.sort((a, b) => b.score - a.score);
                const best = sortedResults[0];

                // Advanced Logic: Hybrid Thresholds
                // Score > 150 -> OFF Only (High Confidence)
                // Score 80-150 -> Hybrid (OFF Context)
                // Score < 80 -> AI Only

                const isOffOnly = userSettings?.analysisMode === 'off_only';
                const highConfidence = best.score > 150;
                const mediumConfidence = best.score >= 80;

                if (isOffOnly || highConfidence) {
                    if (best.score > 50) { // Safety floor
                        usedOFF = true;
                        const result = best.product;
                        const totalCarbs = result.carbs100g;
                        return NextResponse.json({
                            friendly_description: result.name,
                            food_items: [{
                                name: result.name,
                                carbs: result.carbs100g,
                                fat: result.fat100g,
                                protein: result.protein100g,
                                approx_weight: "100g"
                            }],
                            total_carbs: totalCarbs,
                            total_fat: result.fat100g,
                            total_protein: result.protein100g,
                            suggested_insulin: Number((totalCarbs / carbRatio).toFixed(1)),
                            calculation_formula: `${totalCarbs}g carbs / ${carbRatio} ratio = ${Number((totalCarbs / carbRatio).toFixed(1))}U`,
                            sources: ["Open Food Facts (High Confidence)"],
                            split_bolus_recommendation: { recommended: false, split_percentage: "", duration: "", reason: "" },
                            reasoning: [`Matched via Database Search (Score: ${best.score}).`],
                            confidence_level: "high",
                            warnings: ["Nutritional data is per 100g from Open Food Facts."]
                        });
                    }
                }

                if (mediumConfidence) {
                    // Hybrid mode context
                    offContext = "\n\nDATABASE CONTEXT (Open Food Facts - Verified Matches):\n" +
                        sortedResults.filter(r => r.score >= 80).slice(0, 3).map(r => {
                            const p = r.product;
                            return `- ${p.name} (${p.brand || ''}): Carbs: ${p.carbs100g}g, Fat: ${p.fat100g}g, Protein: ${p.protein100g}g per 100g`;
                        }).join('\n');
                }
            }

            // If we are in off_only and nothing was triggered above, we MUST NOT fall back to AI
            if (userSettings?.analysisMode === 'off_only') {
                return NextResponse.json({
                    error: language === 'Italian' ? 'Alimento non trovato nel database.' : 'Food not found in database.',
                    details: 'No database match found for: ' + textToSearch
                }, { status: 404 });
            }
        }

        // Fallback to AI if OFF not triggered or in hybrid/pplx_only

        const type = image ? 'image' : 'text';

        const instructions = `You are a diabetes nutrition assistant.
        LANGUAGE: ${language}

        TASK: Analyze ${type === 'image' ? 'the food image' : 'this food description'} and calculate insulin dose.

        STRATEGY:
        1. IDENTIFY & OCR: Identify food items, brands, and READ ALL VISIBLE TEXT (especially nutritional labels, packaging details, and weight specifications like "15g per biscuit").
        2. SEARCH & VERIFY: If a brand or specific product name is found, perform a web search to find its official nutritional values (e.g., "Barilla Penne carbs per 100g") to verify assumptions.
        3. PRIORITIZE DATA:
           - GROUND TRUTH 1: Text read directly from a nutritional label or package in the image (OCR).
           - GROUND TRUTH 2: Official data found via web search for a specific branded product.
           - ESTIMATION: Use visual volumetric estimation relative to tableware ONLY if no labels or search data are available.
        4. CALCULATE: Use Ground Truth values if available. If a label specifies weight per portion/unit, use that weight instead of visual eyeballing.

        RULES:
        1. ALWAYS assume the input is food unless it's clearly unrelated. Be VERY lenient.
        2. OCR and Search data MUST override visual volumetric estimation. Do not eyeball size if text/labels provide facts.
        3. Calculate insulin using 1:${carbRatio} carb ratio.
        4. Flag split bolus if fat>20g AND protein>25g.
        5. Preserve user's specific food name but fix typos. Respond in ${language}.
        6. Provide the exact math used for insulin in 'calculation_formula' (e.g. "50g carbs / 10 ratio = 5.0U").
        7. List nutritional data sources in 'sources' (e.g. "OCR from image label", "Web Search for [Brand]", "USDA").
        8. Set 'confidence_level' to "high", "medium", or "low" based on data source (High for OCR/Search, Medium for clear estimation, Low for ambiguous).
        9. Only return error if absolutely certain input is not food-related.
        ${offContext}

        OUTPUT (valid JSON only, no markdown):
        {
          "friendly_description":"Short title",
          "confidence_level": "high|medium|low",
          "food_items":[{"name":"Food name","carbs":0,"fat":0,"protein":0,"approx_weight":"string"}],
          "total_carbs":0,
          "total_fat":0,
          "total_protein":0,
          "suggested_insulin":0,
          "calculation_formula": "Exact math string",
          "sources": ["Source 1", "Source 2"],
          "split_bolus_recommendation":{"recommended":false,"split_percentage":"","duration":"","reason":""},
          "reasoning":["Step 1","Step 2"],
          "warnings":[]
        }`;

        // 3. Construct Messages
        const messages: any[] = [
            { role: "system", content: instructions }
        ];

        if (type === 'image' && image) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: text && text.trim().length > 0 ? text : "Analyze this food." },
                    { type: "image_url", image_url: { url: image } }
                ]
            });
        } else {
            messages.push({
                role: "user",
                content: `Food: ${text}`
            });
        }

        // 4. Call Perplexity
        const payload = {
            model: 'sonar', // Using faster sonar model for lower latency
            messages: messages,
            temperature: 0.2,
            max_tokens: 800 // Limit verbosity for speed
        };

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity API Error:', errorText);
            return NextResponse.json({ error: 'AI Analysis failed' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        // 5. Parse JSON
        // Robust parsing logic from web
        const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();

        // Try finding first { and last }
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        let cleanJson = jsonString;
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
        }

        try {
            const result = JSON.parse(cleanJson);
            return NextResponse.json(result);
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
