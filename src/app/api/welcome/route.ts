import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ status: 'online', message: 'Welcome API is active' });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firstName, timeOfDay } = body;

        // Use server-side API key
        const apiKey = process.env.PERPLEXITY_API_KEY || '';
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        // Create a personalized prompt
        const prompt = `Generate a short, distinct, and creative welcome message for a diabetes management app user named "${firstName || 'friend'}". 
The time of day is ${timeOfDay}.
Make it sound cyberpunk or futuristic but friendly.
Keep it under 15 words.
Examples:
- "System online, ${firstName}. Glucose sensors calibrated."
- "Greetings ${firstName}. Ready to hack your metabolism?"`;

        // Use sonar (cheapest model) instead of sonar-pro
        const payload = {
            model: 'sonar',
            messages: [
                {
                    role: 'system',
                    content: 'You are a friendly assistant for a diabetes management app. Keep responses very short and encouraging.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8, // Higher for more creative greetings
            max_tokens: 50
        };

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey} `,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity Welcome API Error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Failed to generate greeting' },
                { status: response.status }
            );
        }

        const data = await response.json();
        const greeting = data.choices?.[0]?.message?.content?.trim() || null;

        return NextResponse.json({ greeting });

    } catch (error: unknown) {
        console.error('Welcome greeting error:', error);
        return NextResponse.json(
            { error: 'Failed to generate greeting' },
            { status: 500 }
        );
    }
}
