/**
 * Web Food Analysis API
 * Primary endpoint for web app - uses Perplexity with OpenAI fallback
 * Backwards compatible with existing web client
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood, type AnalysisResult, getCurrentMealPeriod } from '@/lib/ai-analysis-service';
import type { Settings } from '@/types';

// Default settings for web users without account
const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    carbRatio: 10,
    carbRatios: { breakfast: 8, lunch: 10, dinner: 12 },
    useMealSpecificRatios: false,
    correctionFactor: 50,
    targetGlucose: 110,
    highThreshold: 180,
    lowThreshold: 70,
    smartHistory: true,
    // Credentials removed
    language: 'en',
    mealRemindersEnabled: false,
    reminderTimes: {
        breakfast: new Date().setHours(8, 30, 0, 0),
        lunch: new Date().setHours(12, 30, 0, 0),
        dinner: new Date().setHours(19, 30, 0, 0),
    },
    analysisMode: 'pplx_only',
};

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Extract API Key from header (user-provided or server)
        const authHeader = request.headers.get('Authorization');
        let apiKey = authHeader?.replace('Bearer ', '') || '';

        // Use server key if user key is invalid
        if (!apiKey || apiKey === 'invalid-key' || apiKey.length < 10) {
            apiKey = process.env.PERPLEXITY_API_KEY || '';
        }

        const body = await request.json();

        // Handle greeting request (for welcome messages)
        if (body.type === 'greeting') {
            return handleGreeting(body, apiKey);
        }

        const { messages, model, settings: userSettings } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: { message: 'Invalid request: messages array required' } },
                { status: 400 }
            );
        }

        // Extract text from messages
        const userMessage = messages.find((m: any) => m.role === 'user');
        const systemMessage = messages.find((m: any) => m.role === 'system');

        if (!userMessage) {
            return NextResponse.json(
                { error: { message: 'No user message found' } },
                { status: 400 }
            );
        }

        // Parse settings from system message or use defaults
        const settings = parseSettingsFromSystemMessage(
            systemMessage?.content || '',
            userSettings
        );

        // Extract text content (handle both string and array formats)
        let text = '';
        let image: string | null = null;

        if (typeof userMessage.content === 'string') {
            text = userMessage.content;
        } else if (Array.isArray(userMessage.content)) {
            // Vision format with image
            const textPart = userMessage.content.find((c: any) => c.type === 'text');
            const imagePart = userMessage.content.find((c: any) =>
                c.type === 'image_url' || c.type === 'input_image'
            );
            text = textPart?.text || '';
            image = imagePart?.image_url?.url || imagePart?.url || null;
        }

        console.log('[Web API] Analysis request:', {
            hasImage: !!image,
            textLength: text.length,
            language: settings.language
        });

        // Call unified analysis service
        const analysis = await analyzeFood({
            text,
            image,
            settings,
            provider: 'auto',
            perplexityApiKey: apiKey || process.env.PERPLEXITY_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
        });

        const duration = Date.now() - startTime;
        console.log(`[Web API] Analysis complete in ${duration}ms via ${analysis.provider}`);

        // Convert to OpenAI-compatible format for web client
        const openAIFormat = convertToOpenAIFormat(analysis.result, analysis.provider);

        return NextResponse.json(openAIFormat);

    } catch (error: any) {
        console.error('[Web API] Error:', error);

        return NextResponse.json(
            {
                error: {
                    message: error.message || 'Internal server error',
                    type: error.name || 'unknown_error'
                }
            },
            { status: error.status || 500 }
        );
    }
}

// Handle greeting/welcome message generation
async function handleGreeting(body: any, apiKey: string) {
    const { firstName, timeOfDay } = body;
    const language = body.language === 'it' ? 'Italian' : 'English';

    // Try Perplexity for creative greeting
    if (apiKey && apiKey.length > 10) {
        try {
            const greeting = await generateAIGreeting(firstName, timeOfDay, language, apiKey);
            return NextResponse.json({ greeting });
        } catch (e) {
            console.log('[Greeting] AI failed, using fallback');
        }
    }

    // Fallback greetings
    const fallbackGreetings: Record<string, string[]> = {
        en: [
            `System online, ${firstName || 'User'}. Ready to optimize.`,
            `Welcome back, ${firstName || 'User'}. Let's manage those glucose levels.`,
            `Good ${timeOfDay || 'day'}, ${firstName || 'User'}. Ready when you are.`
        ],
        it: [
            `Sistema online, ${firstName || 'Utente'}. Pronto per ottimizzare.`,
            `Bentornato, ${firstName || 'Utente'}. Gestiamo i livelli di glucosio.`,
            `Buon${timeOfDay === 'morning' ? 'a' : timeOfDay === 'evening' ? 'a' : ''} ${timeOfDay || 'giorno'}, ${firstName || 'Utente'}. Pronto quando vuoi.`
        ]
    };

    const greetings = fallbackGreetings[language === 'Italian' ? 'it' : 'en'];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    return NextResponse.json({ greeting: randomGreeting });
}

async function generateAIGreeting(
    firstName: string,
    timeOfDay: string,
    language: string,
    apiKey: string
): Promise<string> {
    const prompt = language === 'Italian'
        ? `Genera un breve messaggio di benvenuto cyberpunk/futuristico per un'app di diabete. Utente: ${firstName || 'Utente'}. Momento: ${timeOfDay}. Max 10 parole.`
        : `Generate a short cyberpunk/futuristic welcome message for a diabetes app. User: ${firstName || 'User'}. Time: ${timeOfDay}. Max 10 words.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'sonar',
            messages: [
                { role: 'system', content: 'You are a friendly diabetes app assistant. Keep responses very short and encouraging.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 50
        })
    });

    if (!response.ok) {
        throw new Error(`Perplexity error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

// Parse settings from system message content
function parseSettingsFromSystemMessage(content: string, userSettings?: any): Settings {
    const settings = { ...DEFAULT_SETTINGS };

    // Override with explicit user settings if provided
    if (userSettings) {
        Object.assign(settings, userSettings);
        return settings;
    }

    // Try to extract from system message
    if (content.includes('Italian') || content.includes('italiano')) {
        settings.language = 'it';
    }

    // Extract carb ratio
    const ratioMatch = content.match(/1\s*:\s*(\d+)/) || content.match(/ratio.*?(:?\d+)/i);
    if (ratioMatch) {
        settings.carbRatio = parseInt(ratioMatch[1]) || 10;
    }

    // Extract meal-specific ratios
    const breakfastMatch = content.match(/breakfast.*?(:?\d+)/i);
    const lunchMatch = content.match(/lunch.*?(:?\d+)/i);
    const dinnerMatch = content.match(/dinner.*?(:?\d+)/i);

    if (breakfastMatch || lunchMatch || dinnerMatch) {
        settings.useMealSpecificRatios = true;
        settings.carbRatios = {
            breakfast: parseInt(breakfastMatch?.[1] || '8'),
            lunch: parseInt(lunchMatch?.[1] || '10'),
            dinner: parseInt(dinnerMatch?.[1] || '12'),
        };
    }

    return settings;
}

// Convert our AnalysisResult to OpenAI-compatible format for web client
function convertToOpenAIFormat(result: AnalysisResult, provider: string): any {
    // Build reasoning text
    const reasoningText = result.reasoning.join('\n') || result.calculation_formula;

    // Build content with all information
    const content = JSON.stringify({
        ...result,
        _provider: provider,
    });

    return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: provider.includes('perplexity') ? 'sonar-pro' : 'gpt-5-mini',
        choices: [{
            index: 0,
            message: {
                role: 'assistant',
                content: content
            },
            finish_reason: 'stop'
        }],
        usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        }
    };
}

// Health check
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        service: 'web-analyze',
        perplexityConfigured: !!process.env.PERPLEXITY_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString()
    });
}
