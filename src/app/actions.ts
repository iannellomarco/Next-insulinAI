'use server';

export async function generateGreeting(firstName: string, timeOfDay: string) {
    try {
        const apiKey = process.env.PERPLEXITY_API_KEY || '';

        // Fallback prompt for offline/error cases
        const fallbackGreeting = `System access granted, ${firstName || 'User'}. Time to optimize.`;

        if (!apiKey) {
            console.error('API key not configured for greeting');
            return { greeting: fallbackGreeting };
        }

        const prompt = `Generate a short, distinct, and creative welcome message for a diabetes management app user named "${firstName || 'friend'}". 
The time of day is ${timeOfDay}.
Make it sound cyberpunk or futuristic but friendly.
Keep it under 15 words.
Examples:
- "System online, ${firstName}. Glucose sensors calibrated."
- "Greetings ${firstName}. Ready to hack your metabolism?"`;

        const payload = {
            model: 'sonar',
            messages: [
                { role: 'system', content: 'You are a friendly assistant for a diabetes management app. Keep responses very short and encouraging.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 50
        };

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity Greeting Error:', response.status, errorText);
            return { greeting: fallbackGreeting };
        }

        const data = await response.json();
        const greeting = data.choices?.[0]?.message?.content?.trim() || null;

        return { greeting: greeting || fallbackGreeting };

    } catch (error) {
        console.error('Server Action Greeting Error:', error);
        return { greeting: `System access granted, ${firstName || 'User'}. Time to optimize.` };
    }
}
