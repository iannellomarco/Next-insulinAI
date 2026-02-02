import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { text, userSettings } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text input required' }, { status: 400 });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }

        // Construct Prompt
        const systemPrompt = `You are an expert nutritionist and diabetes assistant.
Analyze the user's meal description and estimate the nutritional values.
User Settings:
- Carb Ratio (ICR): 1 unit for ${userSettings?.carbRatio || 10}g carbs
- Target Glucose: ${userSettings?.targetGlucose || 110} mg/dL
- Correction Factor (ISF): 1 unit lowers ${userSettings?.correctionFactor || 50} mg/dL

Return a JSON response ONLY with this structure:
{
  "friendly_description": "A short, readable title for the meal",
  "food_items": [
    { "name": "Food Name", "carbs": 50, "fat": 10, "protein": 20, "quantity": "1 serving" }
  ],
  "total_carbs": 50,
  "total_fat": 10,
  "total_protein": 20,
  "suggested_insulin": 5.0,
  "split_bolus_recommendation": {
    "recommended": false,
    "split_percentage": "50/50",
    "duration": "2 hours",
    "reason": "High fat content delays absorption"
  },
  "reasoning": ["Explanation point 1", "Explanation point 2"]
}

Be conservative with carbs. If unsure, provide a range or estimate based on standard portions.
Current meal: "${text}"`;

        const payload = {
            model: 'sonar-pro',
            messages: [
                { role: 'system', content: 'You are a helpful JSON-only assistant.' },
                { role: 'user', content: systemPrompt }
            ],
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

        // Clean markdown code blocks if present
        const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const result = JSON.parse(jsonString);
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
