// route.ts - Optimized with Perplexity (initial) + OpenAI (follow-up)
import Perplexity from '@perplexity-ai/perplexity_ai';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCarbRatioForCurrentMeal, MealPeriod } from '@/types';

const perplexityClient = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY
});

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Improved JSON extraction with validation
function extractAndValidateJSON(text: string) {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
        text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error('No JSON found in model output');
    }

    try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        if (!parsed.friendly_description) {
            parsed.friendly_description = 'Food analysis';
        }
        if (!Array.isArray(parsed.food_items)) {
            parsed.food_items = [];
        }

        return parsed;
    } catch (e: any) {
        console.error('JSON parse error:', e.message);
        throw new Error(`Failed to parse JSON: ${e.message}`);
    }
}

// Enhanced quantity parser with better regex
function parseQuantity(
    userInput: string,
    perServingCarbs: number,
    approxWeight: string
): { multiplier: number; description: string } {
    const input = userInput.toLowerCase().trim();

    if (/\b(tutta?|intera?|whole|entire|full|tutto)\b/i.test(input)) {
        const packageMatch = approxWeight.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (packageMatch) {
            const totalG = parseFloat(packageMatch[1]);
            return { multiplier: totalG / 100, description: `${totalG}g (whole package)` };
        }
        return { multiplier: 1, description: 'whole package' };
    }

    if (/\b(metà|mezza|half|mezzo)\b/i.test(input)) {
        return { multiplier: 0.5, description: 'half' };
    }

    if (/\b(quarto|quarter|¼)\b/i.test(input)) {
        return { multiplier: 0.25, description: 'quarter' };
    }

    const gramsMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grams?)\b/i);
    if (gramsMatch) {
        const grams = parseFloat(gramsMatch[1]);
        return { multiplier: grams / 100, description: `${grams}g` };
    }

    const piecesMatch = input.match(/(\d+)\s*(?:pezz[io]|pieces?|biscott[io]|items?|units?|porzioni?)/i);
    if (piecesMatch) {
        const pieces = parseInt(piecesMatch[1]);
        const perPieceMatch = approxWeight.match(/(\d+(?:\.\d+)?)\s*g\s*(?:per|each|pezzo|piece)/i);
        if (perPieceMatch) {
            const perPieceG = parseFloat(perPieceMatch[1]);
            const totalG = pieces * perPieceG;
            return { multiplier: totalG / 100, description: `${pieces} piece${pieces > 1 ? 's' : ''} (${totalG}g)` };
        }
        return { multiplier: pieces, description: `${pieces} piece${pieces > 1 ? 's' : ''}` };
    }

    const justNumber = input.match(/^(\d+(?:\.\d+)?)$/);
    if (justNumber) {
        const num = parseFloat(justNumber[1]);
        if (num > 10) {
            return { multiplier: num / 100, description: `${num}g` };
        } else {
            return { multiplier: num, description: `${num} piece${num > 1 ? 's' : ''}` };
        }
    }

    return { multiplier: 1, description: '1 serving' };
}

// Validazione formato immagine base64
function validateImageFormat(imageData: string): { valid: boolean; error?: string } {
    if (!imageData) return { valid: false, error: 'No image data' };

    const dataUriPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!dataUriPattern.test(imageData)) {
        return {
            valid: false,
            error: 'Invalid image format. Expected data:image/jpeg;base64,... or similar'
        };
    }

    const base64Data = imageData.split(',')[1];
    if (!base64Data || base64Data.length < 100) {
        return { valid: false, error: 'Image data too short or empty' };
    }

    if (base64Data.length > 7000000) {
        return { valid: false, error: 'Image too large. Max 5MB.' };
    }

    return { valid: true };
}

export async function POST(req: NextRequest) {
    try {
        const authPromise = auth();
        const bodyPromise = req.json();
        const [{ userId }, body] = await Promise.all([authPromise, bodyPromise]);

        const { text, image, userSettings, mealPeriod, previous_analysis } = body;

        if (!text && !image && !previous_analysis) {
            return NextResponse.json({ error: 'Input required' }, { status: 400 });
        }

        // Validazione immagine se presente
        if (image) {
            const validation = validateImageFormat(image);
            if (!validation.valid) {
                console.error('[Validation] Image error:', validation.error);
                return NextResponse.json(
                    { error: 'Invalid image', details: validation.error },
                    { status: 400 }
                );
            }
        }

        const language = userSettings?.language === 'it' ? 'Italian' : 'English';

        let carbRatio = userSettings?.carbRatio || 10;
        if (userSettings?.useMealSpecificRatios && userSettings?.carbRatios) {
            if (mealPeriod && ['breakfast', 'lunch', 'dinner'].includes(mealPeriod)) {
                carbRatio = userSettings.carbRatios[mealPeriod as MealPeriod];
            } else {
                carbRatio = getCarbRatioForCurrentMeal(userSettings);
            }
        }

        // ========================================
        // FOLLOW-UP: Quantity refinement with OpenAI
        // ========================================
        if (previous_analysis && text) {
            const productName = previous_analysis.friendly_description || 'Product';
            const foodItems = previous_analysis.food_items || [];
            const firstItem = foodItems[0] || { carbs: 0, fat: 0, protein: 0, approx_weight: '100g' };

            const followUpPrompt = `You are a precise nutrition calculator.

CONTEXT:
- Product: ${productName}
- Base nutrition per ${firstItem.approx_weight || '100g'}:
  * Carbs: ${firstItem.carbs}g
  * Fat: ${firstItem.fat}g  
  * Protein: ${firstItem.protein}g
- User consumed: "${text}"
- Insulin ratio: 1 unit per ${carbRatio}g carbs

TASK:
Calculate total nutritional values based on the quantity consumed.

IMPORTANT RULES:
1. Parse the quantity carefully (e.g., "whole package", "half", "100g", "3 pieces")
2. Scale all nutrients proportionally
3. Round to 1 decimal place
4. Calculate insulin dose: total_carbs / ${carbRatio}
5. Include clear calculation formula`;

            try {
                const response = await openaiClient.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: followUpPrompt }],
                    max_tokens: 200,
                    temperature: 0.1,
                    response_format: {
                        type: 'json_schema',
                        json_schema: {
                            name: 'nutrition_calculation',
                            strict: true,
                            schema: {
                                type: 'object',
                                properties: {
                                    total_carbs: { type: 'number' },
                                    total_fat: { type: 'number' },
                                    total_protein: { type: 'number' },
                                    suggested_insulin: { type: 'number' },
                                    calculation_formula: { type: 'string' }
                                },
                                required: ['total_carbs', 'total_fat', 'total_protein', 'suggested_insulin', 'calculation_formula'],
                                additionalProperties: false
                            }
                        }
                    }
                });

                const structured = JSON.parse(response.choices[0]?.message?.content ?? '{}');

                return NextResponse.json({
                    friendly_description: `${productName} (${text})`,
                    food_items: foodItems.map((item: any) => ({
                        ...item,
                        carbs: structured.total_carbs || item.carbs,
                        fat: structured.total_fat || item.fat,
                        protein: structured.total_protein || item.protein,
                        approx_weight: text
                    })),
                    total_carbs: structured.total_carbs || 0,
                    total_fat: structured.total_fat || 0,
                    total_protein: structured.total_protein || 0,
                    suggested_insulin: structured.suggested_insulin || 0,
                    split_bolus_recommendation: { recommended: false, split_percentage: "", duration: "", reason: "" },
                    reasoning: [structured.calculation_formula],
                    calculation_formula: structured.calculation_formula || "",
                    sources: previous_analysis.sources || [],
                    confidence_level: "high",
                    missing_info: null,
                    warnings: []
                });

            } catch (aiError: any) {
                console.error('[Follow-up] OpenAI error:', aiError.message);

                const { multiplier, description } = parseQuantity(text, firstItem.carbs, firstItem.approx_weight || '100g');
                const totalCarbs = Math.round(firstItem.carbs * multiplier * 10) / 10;
                const totalFat = Math.round(firstItem.fat * multiplier * 10) / 10;
                const totalProtein = Math.round(firstItem.protein * multiplier * 10) / 10;
                const suggestedInsulin = Math.round((totalCarbs / carbRatio) * 10) / 10;

                return NextResponse.json({
                    friendly_description: `${productName} (${description})`,
                    food_items: foodItems.map((item: any) => ({
                        ...item,
                        carbs: Math.round(item.carbs * multiplier * 10) / 10,
                        fat: Math.round(item.fat * multiplier * 10) / 10,
                        protein: Math.round(item.protein * multiplier * 10) / 10,
                        approx_weight: description
                    })),
                    total_carbs: totalCarbs,
                    total_fat: totalFat,
                    total_protein: totalProtein,
                    suggested_insulin: suggestedInsulin,
                    split_bolus_recommendation: { recommended: false, split_percentage: "", duration: "", reason: "" },
                    reasoning: [`${language === 'Italian' ? 'Calcolo locale' : 'Local calculation'}: ${totalCarbs}g ÷ ${carbRatio} = ${suggestedInsulin}U`],
                    calculation_formula: `${totalCarbs}g ÷ ${carbRatio} = ${suggestedInsulin}U`,
                    sources: previous_analysis.sources || [],
                    confidence_level: "high",
                    missing_info: null,
                    warnings: []
                });
            }
        }

        // ========================================
        // INITIAL ANALYSIS: Perplexity con Vision corretta
        // ========================================
        const systemPrompt = `You are a precise diabetes nutrition assistant specialized in analyzing food images and extracting nutritional data.

Language: ${language}
User's Insulin Ratio: 1 unit per ${carbRatio}g carbs

=== IMAGE ANALYSIS INSTRUCTIONS ===
When analyzing a food image:
1. CAREFULLY examine the photo for:
   - Nutrition facts label (Nutrition Facts, Valori Nutrizionali, Informazioni Nutrizionali)
   - Product name and brand
   - Serving size (porzione, serving size)
   - Values per 100g AND per serving
   - Ingredients list
   - Any barcodes or QR codes

2. If nutrition label is VISIBLE:
   - Extract EXACT numeric values
   - Report carbohydrates, fat, protein per 100g
   - Note the serving size in grams
   - Use the actual values from the label, never estimate

3. If NO nutrition label is visible:
   - Identify the food item precisely
   - Use reliable nutritional databases
   - Mark confidence_level as "medium" or "low"

=== INSULIN CALCULATION RULES ===
1. If user shows product WITHOUT specifying quantity eaten:
   - Set suggested_insulin = 0
   - Set missing_info = "${language === 'Italian' ? 'Quanto ne hai mangiato? (es. tutta la confezione, metà, 100g, 3 pezzi)' : 'How much did you eat? (e.g. whole package, half, 100g, 3 pieces)'}"
   - Provide nutrition per 100g or per serving

2. Only calculate insulin if quantity is EXPLICIT and CLEAR

=== DATA SOURCES PRIORITY ===
1. Values visible in the image (highest priority)
2. Official manufacturer website
3. USDA FoodData Central, OpenFoodFacts
4. General nutritional estimates (lowest priority)

=== RESPONSE FORMAT ===
Respond with ONLY valid JSON (no markdown, no explanations outside JSON):

{
  "friendly_description": "short descriptive food name",
  "food_items": [{
    "name": "specific food name",
    "carbs": 0.0,
    "fat": 0.0,
    "protein": 0.0,
    "approx_weight": "100g or serving size"
  }],
  "total_carbs": 0.0,
  "total_fat": 0.0,
  "total_protein": 0.0,
  "suggested_insulin": 0.0,
  "split_bolus_recommendation": {
    "recommended": false,
    "split_percentage": "",
    "duration": "",
    "reason": ""
  },
  "reasoning": ["step-by-step calculation explanation"],
  "calculation_formula": "formula used",
  "sources": ["source1", "source2"],
  "confidence_level": "high|medium|low",
  "missing_info": null or "quantity question"
}`;

        // Log per debug
        console.log('[Perplexity] Request:', {
            hasImage: !!image,
            imageDataLength: image?.length || 0,
            text: text?.substring(0, 100),
            timestamp: new Date().toISOString()
        });

        const response = await perplexityClient.responses.create({
            model: 'openai/gpt-5-mini',  // Vision-capable model per docs
            input: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: image ? [
                        { type: 'input_text', text: text?.trim() || 'Analyze the nutritional information from this food image in detail. Extract all visible data from nutrition labels.' },
                        { type: 'input_image', image_url: image }
                    ] : [
                        { type: 'input_text', text: `Analyze this food: ${text}` }
                    ]
                }
            ] as any,
            max_output_tokens: 2048,
        });

        // Log risposta per debug
        console.log('[Perplexity] Response:', {
            outputLength: response.output_text?.length,
            hasCitations: !!(response as any).citations,
            citationsCount: (response as any).citations?.length || 0
        });

        const content = response.output_text || '{}';
        console.log('[Perplexity] Raw output:', content.substring(0, 500));

        let structured;
        try {
            structured = extractAndValidateJSON(content);
        } catch (parseError: any) {
            console.error('[Perplexity] JSON parse error:', parseError.message);
            console.error('[Perplexity] Raw content:', content);
            throw new Error(`Failed to parse Perplexity response: ${parseError.message}`);
        }

        const citations = (response as any).citations || [];
        console.log('[Perplexity] Citations:', citations);

        const result = {
            friendly_description: structured.friendly_description || (text || 'Food analysis'),
            food_items: structured.food_items || [],
            total_carbs: Number(structured.total_carbs) || 0,
            total_fat: Number(structured.total_fat) || 0,
            total_protein: Number(structured.total_protein) || 0,
            suggested_insulin: Number(structured.suggested_insulin) || 0,
            split_bolus_recommendation: structured.split_bolus_recommendation || {
                recommended: false,
                split_percentage: "",
                duration: "",
                reason: ""
            },
            reasoning: Array.isArray(structured.reasoning) ? structured.reasoning : [],
            calculation_formula: structured.calculation_formula || "",
            sources: citations.length > 0
                ? citations.map((c: any) => c.url || c)
                : (Array.isArray(structured.sources) ? structured.sources : []),
            confidence_level: structured.confidence_level || "medium",
            missing_info: structured.missing_info || null,
            warnings: Array.isArray(structured.warnings) ? structured.warnings : []
        };

        if (result.suggested_insulin === 0 && result.food_items.length > 0 && !result.missing_info) {
            result.missing_info = language === 'Italian'
                ? "Quantità mancante. Quanti grammi o pezzi hai mangiato?"
                : "Quantity missing. How many grams or pieces did you eat?";
        }

        return NextResponse.json(result);

    } catch (err: any) {
        console.error('[Analysis] Error:', err);

        if (err.status === 400) {
            return NextResponse.json(
                { error: 'Invalid request', details: err.message },
                { status: 400 }
            );
        }

        if (err.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Analysis failed', details: err.message ?? 'Unknown error' },
            { status: 500 }
        );
    }
}

// GET endpoint per test
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        perplexityConfigured: !!process.env.PERPLEXITY_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString()
    });
}
