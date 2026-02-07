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

        RULES:
        1. Identify food items, estimate carbs, fat, protein.
        2. Calculate insulin using 1:${carbRatio} carb ratio.
        3. If quantity is unknown, set suggested_insulin to 0 and ask in 'missing_info'.
        4. Set confidence_level to "high", "medium", or "low".
        5. FRIENDLY_DESCRIPTION: Max 3-5 words, just the product name.
        6. Respond in ${language}.

        RESPOND IN THIS EXACT JSON FORMAT:
        {
            "reasoning": ["step 1", "step 2"],
            "friendly_description": "Product Name",
            "confidence_level": "high|medium|low",
            "missing_info": null or "question string",
            "food_items": [{"name": "...", "carbs": 0, "fat": 0, "protein": 0, "approx_weight": "100g"}],
            "total_carbs": 0,
            "total_fat": 0,
            "total_protein": 0,
            "suggested_insulin": 0,
            "calculation_formula": "Xg carbs / Y ratio = Z U",
            "sources": ["estimation"],
            "split_bolus_recommendation": {"recommended": false, "split_percentage": "", "duration": "", "reason": ""},
            "warnings": []
        }`;

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

        // Call OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-5-mini', // Fast and capable, good for food analysis
                messages: messages,
                max_completion_tokens: 1000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API Error:', errorText);
            return NextResponse.json({ error: 'OpenAI Analysis failed' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        try {
            const result = JSON.parse(content);

            // Safety net: ensure missing_info is set if insulin is 0 with recognized food
            if (result.suggested_insulin === 0 && result.food_items?.length > 0 && !result.missing_info) {
                result.missing_info = language === 'Italian'
                    ? "Quantità mancante. Quanti pezzi o grammi hai mangiato?"
                    : "Quantity missing. How many pieces or grams did you eat?";
            }

            return NextResponse.json(result);
        } catch (e) {
            console.error('Failed to parse OpenAI response:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error) {
        console.error('OpenAI Analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
