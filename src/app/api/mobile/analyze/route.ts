// route.ts - Perplexity SDK with text + image support + lightweight follow-up
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

        // LIGHTWEIGHT FOLLOW-UP: if previous_analysis exists, use minimal tokens
        if (previous_analysis && text) {
            // Extract only essential info: product name + nutrients
            const productName = previous_analysis.friendly_description || 'Product';
            const foodItems = previous_analysis.food_items || [];

            // Build compact context (NO sources, NO reasoning, NO formula)
            const compactContext = foodItems.map((item: any) =>
                `${item.name}: ${item.carbs}g carbs, ${item.fat}g fat, ${item.protein}g protein per ${item.approx_weight || 'serving'}`
            ).join('; ');

            const followUpPrompt = `Product: ${productName}
Nutrition: ${compactContext}
User says: ${text}
Ratio: 1:${carbRatio}

Calculate final insulin based on user's quantity. Return JSON only:
{"friendly_description":"...","food_items":[{name,carbs,fat,protein,approx_weight}],"total_carbs":N,"total_fat":N,"total_protein":N,"suggested_insulin":N,"split_bolus_recommendation":{"recommended":bool},"reasoning":["..."],"calculation_formula":"...","sources":[],"confidence_level":"high","missing_info":null}`;

            const response = await client.responses.create({
                preset: 'fast-search',
                input: followUpPrompt,  // Simple string input for follow-up
                max_output_tokens: 512,  // Smaller output for refinement
            });

            const structured = extractJSON(response.output_text ?? '');
            return NextResponse.json({
                friendly_description: structured.friendly_description || productName,
                food_items: structured.food_items || foodItems,
                total_carbs: structured.total_carbs || 0,
                total_fat: structured.total_fat || 0,
                total_protein: structured.total_protein || 0,
                suggested_insulin: structured.suggested_insulin || 0,
                split_bolus_recommendation: structured.split_bolus_recommendation || { recommended: false },
                reasoning: structured.reasoning || [],
                calculation_formula: structured.calculation_formula || "",
                sources: previous_analysis.sources || [],  // Reuse original sources
                confidence_level: structured.confidence_level || "high",
                missing_info: null,
                warnings: structured.warnings || []
            });
        }

        // INITIAL ANALYSIS: Full prompt for new analysis
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
  3. List product with "per serving" nutrients from label
- Only calculate insulin if quantity is explicit
- When in doubt, ALWAYS ask via missing_info`;

        // Build content array
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
