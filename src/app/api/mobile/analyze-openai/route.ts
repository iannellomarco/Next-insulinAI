import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCarbRatioForCurrentMeal, MealPeriod } from '@/types';
export const runtime = 'edge';
/**
 * OpenAI-powered food analysis endpoint
 * Uses GPT-4o-mini for fast, cost-effective analysis
 * 
 * Environment variable required: OPENAI_API_KEY
 */
export async function POST(request: NextRequest) {
    const authPromise = auth();
    const bodyPromise = request.json();
    try {
        const [{ userId }, body] = await Promise.all([authPromise, bodyPromise]);
        // Check authentication
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { text, image, userSettings, mealPeriod, previous_analysis } = body;
        if (!text && !image && !previous_analysis) {
            return NextResponse.json({ error: 'Input required (text, image, or previous_analysis)' }, { status: 400 });
        }
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
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
        const type = image ? 'image' : 'text';
        const previousContext = previous_analysis ?
            `\nPREVIOUS ANALYSIS CONTEXT:
            The user is Refining a previous analysis.
            PREVIOUS RESULT: ${JSON.stringify(previous_analysis)}
            USER FEEDBACK/UPDATE: "${text}"
            
            TASK ADJUSTMENT: Use the PREVIOUS RESULT as a starting point. Trust valid parts of it. Update only what needs changing based on USER FEEDBACK. If the user provides the missing info, remove the 'missing_info' flag.`
            : "";
        const instructions = `You are a diabetes nutrition assistant.
LANGUAGE: ${language}

TASK: Analyze ${type === 'image' ? 'the food image' : 'this food description'} and calculate insulin dose.
${previousContext}

STRATEGY:
1. IDENTIFY & OCR: Identify food items, brands, and READ ALL VISIBLE TEXT (especially nutritional labels, packaging details, and weight specifications like "15g per biscuit").
2. SEARCH & VERIFY: 
   - If a brand or specific product name is found, use your knowledge base to find official nutritional values (e.g., "Barilla Penne carbs per 100g").
   - DO NOT just stop at '/100g' values. Actively look for and report 'per item', 'per portion', or 'per biscuit' values to be more precise.
3. PRIORITIZE DATA:
   - GROUND TRUTH 1: Text read directly from a nutritional label or package in the image (OCR).
   - GROUND TRUTH 2: Official "per item" data from your training data for specific branded products.
   - ESTIMATION: Use visual volumetric estimation relative to tableware ONLY if no labels or specific data are available.
4. MISSING INFO:
   - If you are forced to make a rough guess because of missing details (brand, flavor), you MUST populate the 'missing_info' field.
   - CRITICAL: If you have "per item" data (e.g. 1 biscuit = 7g) but DO NOT know the quantity/count (e.g. how many biscuits in the image), you MUST populate 'missing_info' with a question like "How many biscuits did you eat?".
   - Ask the user specifically for what is missing.

5. CALCULATE: 
   - Use Ground Truth values if available. 
   - If a label specifies weight per portion/unit, use that weight instead of visual eyeballing.
   - If 'missing_info' is populated, set suggested_insulin to 0 and explain why in 'calculation_formula'.

RULES:
1. ALWAYS assume the input is food unless it's clearly unrelated. Be VERY lenient.
2. OCR and specific data MUST override visual volumetric estimation. Do not eyeball size if text/labels provide facts.
3. EXTRACT QUANTITY FROM USER IF UNKNOWN:
   - Example JSON for "1 biscuit = 7g" but unknown count:
     {
       "missing_info": "I found Gocciole (7g carbs each), but how many did you eat?",
       "suggested_insulin": 0,
       "calculation_formula": "Carbs known (7g/item) * Unknown Qty = 0U",
       ...
     }
4. CRITICAL LOGIC ENFORCEMENT for USER INTERACTION:
   - IF suggested_insulin is 0 due to missing quantity: YOU MUST POPULATE 'missing_info'.
   - EXPLAINING IT IN 'calculation_formula' OR 'reasoning' IS NOT ENOUGH. The 'missing_info' field controls the UI popup.
   - Rule: (suggested_insulin == 0 && food_items.length > 0) => missing_info != null.
5. Calculate insulin using 1:${carbRatio} carb ratio.
6. Flag split bolus if fat>20g AND protein>25g.
7. Preserve user's specific food name but fix typos. Respond in ${language}.
8. Provide the exact math used for insulin in 'calculation_formula' (e.g. "50g carbs / 10 ratio = 5.0U").
9. List nutritional data sources in 'sources' (e.g. "OCR from image label", "Knowledge Base [Brand]", "USDA").
10. Set 'confidence_level' to "high", "medium", or "low" based on data source (High for OCR/Specific data, Medium for clear estimation, Low for ambiguous).
11. If precise data is missing, set 'missing_info' to a helpful question string.
12. Only return error if absolutely certain input is not food-related.
13. FRIENDLY_DESCRIPTION RULE: Keep it EXTREMELY CONCISE (Max 3-5 words). Just the product name (e.g. "Gocciole Biscuits"). DO NOT include packaging details, weight info, or nutritional summaries in the title. Put those in 'reasoning'.`;
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
        // Call OpenAI with structured outputs
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                messages: messages,
                max_completion_tokens: 2000,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'food_analysis',
                        strict: true,
                        schema: {
                            type: 'object',
                            properties: {
                                reasoning: { type: 'array', items: { type: 'string' } },
                                friendly_description: { type: 'string' },
                                confidence_level: { type: 'string', enum: ['high', 'medium', 'low'] },
                                missing_info: {
                                    type: ['string', 'null'],
                                    description: 'Question to ask user if quantity is unknown, or null if all info is available'
                                },
                                food_items: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            carbs: { type: 'number' },
                                            fat: { type: 'number' },
                                            protein: { type: 'number' },
                                            approx_weight: { type: ['string', 'null'] }
                                        },
                                        required: ['name', 'carbs', 'fat', 'protein', 'approx_weight'],
                                        additionalProperties: false
                                    }
                                },
                                total_carbs: { type: 'number' },
                                total_fat: { type: 'number' },
                                total_protein: { type: 'number' },
                                suggested_insulin: { type: 'number' },
                                calculation_formula: { type: 'string' },
                                sources: { type: 'array', items: { type: 'string' } },
                                split_bolus_recommendation: {
                                    type: 'object',
                                    properties: {
                                        recommended: { type: 'boolean' },
                                        split_percentage: { type: 'string' },
                                        duration: { type: 'string' },
                                        reason: { type: 'string' }
                                    },
                                    required: ['recommended', 'split_percentage', 'duration', 'reason'],
                                    additionalProperties: false
                                },
                                warnings: { type: 'array', items: { type: 'string' } }
                            },
                            required: [
                                'reasoning', 'friendly_description', 'confidence_level', 'missing_info',
                                'food_items', 'total_carbs', 'total_fat', 'total_protein',
                                'suggested_insulin', 'calculation_formula', 'sources',
                                'split_bolus_recommendation', 'warnings'
                            ],
                            additionalProperties: false
                        }
                    }
                }
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API Error:', errorText);
            return NextResponse.json({ error: 'OpenAI Analysis failed', details: errorText }, { status: 500 });
        }
        const data = await response.json();

        // Handle OpenAI response - content is already JSON when using json_schema
        let result;
        const content = data.choices?.[0]?.message?.content;

        if (typeof content === 'string') {
            try {
                result = JSON.parse(content);
            } catch (e) {
                console.error('Failed to parse OpenAI response:', content);
                return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
            }
        } else if (typeof content === 'object' && content !== null) {
            // Sometimes OpenAI returns the object directly
            result = content;
        } else {
            console.error('Unexpected OpenAI response format:', data);
            return NextResponse.json({ error: 'Unexpected AI response format' }, { status: 500 });
        }
        // Safety net: ensure missing_info is set if insulin is 0 with recognized food
        if (result.suggested_insulin === 0 && result.food_items?.length > 0 && !result.missing_info) {
            result.missing_info = language === 'Italian'
                ? "Quantità mancante. Quanti pezzi o grammi hai mangiato?"
                : "Quantity missing. How many pieces or grams did you eat?";
            result.warnings = [...(result.warnings || []), "Auto-generated missing info request"];
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('OpenAI Analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
