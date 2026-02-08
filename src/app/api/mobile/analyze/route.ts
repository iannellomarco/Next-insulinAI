// route.ts - Perplexity SDK with instant backend refinement (NO AI for follow-up)
import Perplexity from '@perplexity-ai/perplexity_ai';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCarbRatioForCurrentMeal, MealPeriod } from '@/types';

const client = new Perplexity({ apiKey: process.env.PERPLEXITY_API_KEY });

// Extract JSON from model output
function extractJSON(text: string) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in model output');
    return JSON.parse(match[0]);
}

// Parse quantity from user input (e.g., "50g", "3 pieces", "tutta la confezione")
function parseQuantity(userInput: string, perServingCarbs: number, approxWeight: string): { multiplier: number; description: string } {
    const input = userInput.toLowerCase().trim();

    // Whole package patterns
    if (/tutta|intera|whole|entire|full|tutto/i.test(input)) {
        // Check if approxWeight contains total package weight
        const packageMatch = approxWeight.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (packageMatch) {
            const totalG = parseFloat(packageMatch[1]);
            return { multiplier: totalG / 100, description: `${totalG}g (whole)` };
        }
        return { multiplier: 1, description: 'whole package' };
    }

    // Half patterns
    if (/metà|mezza|half/i.test(input)) {
        return { multiplier: 0.5, description: 'half' };
    }

    // Grams pattern: "50g", "100 g", "200 grams"
    const gramsMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|gram)/i);
    if (gramsMatch) {
        const grams = parseFloat(gramsMatch[1]);
        return { multiplier: grams / 100, description: `${grams}g` };
    }

    // Pieces pattern: "3 pieces", "2 biscotti", "5 pezzi"
    const piecesMatch = input.match(/(\d+)\s*(?:pezz|piece|biscott|item|unit|porzi)/i);
    if (piecesMatch) {
        const pieces = parseInt(piecesMatch[1]);
        // Try to get per-piece weight from approxWeight
        const perPieceMatch = approxWeight.match(/(\d+(?:\.\d+)?)\s*g\s*(?:per|each|pezzo|piece)/i);
        if (perPieceMatch) {
            const perPieceG = parseFloat(perPieceMatch[1]);
            return { multiplier: (pieces * perPieceG) / 100, description: `${pieces} pieces (${pieces * perPieceG}g)` };
        }
        return { multiplier: pieces, description: `${pieces} pieces` };
    }

    // Just a number (assume grams or pieces based on magnitude)
    const justNumber = input.match(/^(\d+(?:\.\d+)?)$/);
    if (justNumber) {
        const num = parseFloat(justNumber[1]);
        if (num > 10) {
            // Likely grams
            return { multiplier: num / 100, description: `${num}g` };
        } else {
            // Likely pieces
            return { multiplier: num, description: `${num} pieces` };
        }
    }

    // Default: assume 1 serving
    return { multiplier: 1, description: '1 serving' };
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

        const language = userSettings?.language === 'it' ? 'Italian' : 'English';

        let carbRatio = userSettings?.carbRatio || 10;
        if (userSettings?.useMealSpecificRatios && userSettings?.carbRatios) {
            if (mealPeriod && ['breakfast', 'lunch', 'dinner'].includes(mealPeriod)) {
                carbRatio = userSettings.carbRatios[mealPeriod as MealPeriod];
            } else {
                carbRatio = getCarbRatioForCurrentMeal(userSettings);
            }
        }

        // AI REFINEMENT: Fast model call WITHOUT web search
        if (previous_analysis && text) {
            const productName = previous_analysis.friendly_description || 'Product';
            const foodItems = previous_analysis.food_items || [];
            const firstItem = foodItems[0] || { carbs: 0, fat: 0, protein: 0, approx_weight: '100g' };

            // Build compact context
            const compactContext = foodItems.map((item: any) =>
                `${item.name}: ${item.carbs}g carbs, ${item.fat}g fat, ${item.protein}g protein per ${item.approx_weight || '100g'}`
            ).join('; ');

            const followUpPrompt = `Calculate insulin from quantity. Return ONLY JSON, no explanation.

Product: ${productName}
Nutrition per 100g: C=${firstItem.carbs}g F=${firstItem.fat}g P=${firstItem.protein}g
User quantity: "${text}"
Ratio: 1:${carbRatio}

JSON format:
{"total_carbs":N,"total_fat":N,"total_protein":N,"suggested_insulin":N,"calculation_formula":"Xg/ratio=Yu"}`;

            try {
                const response = await client.responses.create({
                    model: 'openai/gpt-5-mini',
                    input: followUpPrompt,
                    max_output_tokens: 200,
                    tools: [],
                });

                console.log('[Follow-up] AI response:', response.output_text);

                const structured = extractJSON(response.output_text ?? '');

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
                    reasoning: [structured.calculation_formula || `${structured.total_carbs}g / ${carbRatio} = ${structured.suggested_insulin}U`],
                    calculation_formula: structured.calculation_formula || "",
                    sources: previous_analysis.sources || [],
                    confidence_level: "high",
                    missing_info: null,
                    warnings: []
                });
            } catch (aiError: any) {
                console.error('[Follow-up] AI error, falling back to local calc:', aiError.message);

                // LOCAL FALLBACK: Parse quantity and calculate
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
                    reasoning: [`${language === 'Italian' ? 'Calcolo locale' : 'Local calculation'}: ${totalCarbs}g / ${carbRatio} = ${suggestedInsulin}U`],
                    calculation_formula: `${totalCarbs}g / ${carbRatio} = ${suggestedInsulin}U`,
                    sources: previous_analysis.sources || [],
                    confidence_level: "high",
                    missing_info: null,
                    warnings: []
                });
            }
        }

        // INITIAL ANALYSIS: Full AI call with web search
        const systemPrompt = `You are a diabetes nutrition assistant. Language: ${language}

Return ONLY valid JSON. No prose. No markdown.

Schema:
{
  "friendly_description": "short food name",
  "food_items": [{ "name": string, "carbs": number, "fat": number, "protein": number, "approx_weight": string }],
  "total_carbs": number,
  "total_fat": number,
  "total_protein": number,
  "suggested_insulin": number,
  "split_bolus_recommendation": { "recommended": boolean, "split_percentage": "", "duration": "", "reason": "" },
  "reasoning": [string],
  "calculation_formula": string,
  "sources": [string],
  "confidence_level": "high" | "medium" | "low",
  "missing_info": string | null
}

Rules:
- Insulin ratio: 1:${carbRatio}
- suggested_insulin = total_carbs / ${carbRatio}
- Use web search for accurate nutritional data
- Respond in ${language}

CRITICAL - Quantity handling:
- If user shows a PRODUCT PACKAGE or NUTRITION LABEL without specifying quantity, you MUST:
  1. Set suggested_insulin = 0
  2. Set missing_info to: "${language === 'Italian' ? 'Quanto ne hai mangiato? (es. tutta la confezione, mezza, 100g)' : 'How much did you eat? (e.g. whole package, half, 100g)'}"
  3. List product with "per 100g" nutrients from label
- Only calculate insulin if quantity is explicit
- When in doubt, ALWAYS ask via missing_info`;

        const userContent: any[] = [
            { type: 'input_text', text: systemPrompt }
        ];

        if (image) {
            userContent.push({
                type: 'input_image',
                image_url: image
            });
            if (text && text.trim().length > 0) {
                userContent.push({ type: 'input_text', text: `User note: ${text}` });
            } else {
                userContent.push({ type: 'input_text', text: 'Analyze the food in this image.' });
            }
        } else {
            userContent.push({ type: 'input_text', text: `Query: ${text}` });
        }

        const response = await client.responses.create({
            preset: 'fast-search',
            input: [
                {
                    type: 'message',
                    role: 'user',
                    content: userContent
                }
            ] as any,
            max_output_tokens: 1024,
        });

        const structured = extractJSON(response.output_text ?? '');

        const result = {
            friendly_description: structured.friendly_description || (text || 'Food analysis'),
            food_items: structured.food_items || [],
            total_carbs: structured.total_carbs || 0,
            total_fat: structured.total_fat || 0,
            total_protein: structured.total_protein || 0,
            suggested_insulin: structured.suggested_insulin || 0,
            split_bolus_recommendation: structured.split_bolus_recommendation || { recommended: false, split_percentage: "", duration: "", reason: "" },
            reasoning: structured.reasoning || [],
            calculation_formula: structured.calculation_formula || "",
            sources: structured.sources || [],
            confidence_level: structured.confidence_level || "medium",
            missing_info: structured.missing_info || null,
            warnings: structured.warnings || []
        };

        // Auto-add missing_info if insulin is 0 but food items exist
        if (result.suggested_insulin === 0 && result.food_items.length > 0 && !result.missing_info) {
            result.missing_info = language === 'Italian'
                ? "Quantità mancante. Quanti pezzi o grammi hai mangiato?"
                : "Quantity missing. How many pieces or grams did you eat?";
        }

        return NextResponse.json(result);

    } catch (err: any) {
        console.error('Analysis error:', err);
        return NextResponse.json(
            { error: 'AI Analysis failed', details: err.message ?? 'Unknown error' },
            { status: 500 }
        );
    }
}
