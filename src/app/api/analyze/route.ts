import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // 1. Extract API Key
        const authHeader = request.headers.get('Authorization');
        let apiKey = authHeader?.replace('Bearer ', '') || '';

        // If the key is empty or clearly invalid, fallback to the server-side environment variable.
        if (!apiKey || apiKey === 'invalid-key' || apiKey.length < 10) {
            console.log("Using system env key for Perplexity.");
            apiKey = process.env.PERPLEXITY_API_KEY || '';
        }

        // 2. Parse Body
        const body = await request.json();
        const { messages, model } = body;

        // 3. Construct Payload (Strict OpenAI Compatibility)
        const payload = {
            model: model || 'sonar-pro',
            messages: messages,
            // Perplexity recommended parameters
            temperature: 0.2,
            top_p: 0.9,
            return_citations: true,
            search_domain_filter: ["perplexity.ai"], // Optional, can be removed
            return_images: false,
            return_related_questions: false,
            search_recency_filter: "month",
            top_k: 0,
            stream: false,
            presence_penalty: 0,
            frequency_penalty: 1
        };

        // Remove extra params that might cause issues if Perplexity is strict, 
        // but 'sonar-pro' usually accepts standard OpenAI params.
        // Let's stick to the essentials to avoid 400s, but the 401 was the main issue.

        // Simplified Payload for maximum compatibility
        const cleanPayload = {
            model: 'sonar-pro',
            messages: messages,
            temperature: 0.1
        };

        console.log(`Sending request to Perplexity (Model: ${cleanPayload.model})...`);

        // 4. Make Request
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(cleanPayload)
        });

        const responseText = await response.text();

        // 5. Handle Errors
        if (!response.ok) {
            console.error("Perplexity API Error:", response.status, responseText);
            // If 401, it really means the Key is bad.
            return NextResponse.json(
                { error: { message: `Perplexity API Error: ${response.status} - ${responseText}` } },
                { status: response.status }
            );
        }

        // 6. Parse & Return Success
        try {
            const data = JSON.parse(responseText);
            // Perplexity usually returns choices[0].message.content
            // We just forward the whole data object or normalized response
            return NextResponse.json(data);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return NextResponse.json(
                { error: { message: "Invalid JSON response from AI provider." } },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Route Handler Error:', error);
        return NextResponse.json(
            { error: { message: error.message || 'Internal Server Error' } },
            { status: 500 }
        );
    }
}
