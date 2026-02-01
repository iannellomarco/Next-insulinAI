import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a diabetes health expert. Generate exactly 5 unique, helpful, and interesting facts about diabetes management, insulin, blood sugar, or nutrition for diabetics. Each fact should be concise (under 15 words), practical, and encouraging. Return ONLY a JSON array of strings, no markdown.'
                    },
                    {
                        role: 'user',
                        content: 'Generate 5 diabetes health tips.'
                    }
                ],
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from AI');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON array from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const facts = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ facts });
        }
        
        throw new Error('Could not parse facts');
    } catch (error) {
        console.error('Error generating facts:', error);
        // Return empty to fall back to static facts
        return NextResponse.json({ facts: [] });
    }
}
