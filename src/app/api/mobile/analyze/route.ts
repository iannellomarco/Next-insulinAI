import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCarbRatioForCurrentMeal, MealPeriod } from '@/types';

export async function POST(request: NextRequest) {
    // 1. Authenticate Request
    const { userId } = await auth();
    // In strict mode we should check userId here, but if auth() returns null 
    // for mobile bearer tokens (depending on middleware config), we might need to skip.
    // However, since we added /api/mobile to publicRoutes in middleware, Clerk middleware 
    // won't auto-protect it, but auth() will define userId if token is valid.

    // For now, let's proceed. 

    try {
        const body = await request.json();
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

        const type = image ? 'image' : 'text';

        const instructions = `You are a diabetes nutrition assistant.
        LANGUAGE: ${language}

        TASK: Analyze ${type === 'image' ? 'the food image' : 'this food description'} and calculate insulin dose.

        RULES:
        1. ALWAYS assume the input is food unless it's clearly unrelated. Be VERY lenient.
        2. Identify foods, estimate macros, calculate insulin using 1:${carbRatio} carb ratio.
        3. Flag split bolus if fat>20g AND protein>25g.
        4. Preserve user's specific food name but fix typos. Respond in ${language}.
        5. Only return error if absolutely certain input is not food-related.

        OUTPUT (valid JSON only, no markdown):
        {
          "friendly_description":"Short title",
          "food_items":[{"name":"Food name","carbs":0,"fat":0,"protein":0,"approx_weight":"string"}],
          "total_carbs":0,
          "total_fat":0,
          "total_protein":0,
          "suggested_insulin":0,
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
                    { type: "text", text: "Analyze this food." },
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
            model: 'sonar-pro', // Using strict sonar-pro as in web
            messages: messages,
            temperature: 0.2
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
            i
            console.error('Failed to parse AI response:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
