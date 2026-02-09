import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            insulin, 
            carbs, 
            protein, 
            fat, 
            entries, 
            currentGlucose, 
            language = 'en',
            historyContext = []
        } = body;

        const prompt = buildHealthPrompt({
            insulin,
            carbs,
            protein,
            fat,
            entries,
            currentGlucose,
            language,
            historyContext
        });

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a supportive diabetes health assistant. Provide brief, encouraging health insights (max 2 sentences) based on user's daily nutrition and glucose data. Be specific about macronutrients and glucose trends. Respond in ${language === 'it' ? 'Italian' : 'English'}.`
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Health Feedback] OpenAI error:', errorText);
            return NextResponse.json(
                { error: 'AI service unavailable', fallback: getFallbackFeedback(language) },
                { status: 200 }
            );
        }

        const data = await response.json();
        const feedback = data.choices?.[0]?.message?.content || getFallbackFeedback(language);

        return NextResponse.json({ 
            feedback,
            timestamp: Date.now(),
            metrics: { insulin, carbs, protein, fat, entries, currentGlucose }
        });

    } catch (error) {
        console.error('[Health Feedback] Error:', error);
        return NextResponse.json(
            { error: 'Internal error', fallback: getFallbackFeedback('en') },
            { status: 500 }
        );
    }
}

function buildHealthPrompt({
    insulin,
    carbs,
    protein,
    fat,
    entries,
    currentGlucose,
    language,
    historyContext
}: {
    insulin: number;
    carbs: number;
    protein: number;
    fat: number;
    entries: number;
    currentGlucose?: number;
    language: string;
    historyContext: any[];
}): string {
    const glucoseText = currentGlucose 
        ? `Current glucose: ${Math.round(currentGlucose)} mg/dL`
        : 'No current glucose reading';

    const historyText = historyContext.length > 0
        ? `Recent glucose trend: ${historyContext.slice(-3).map((h: any) => Math.round(h.value)).join(' → ')} mg/dL`
        : 'No recent glucose data';

    return `Analyze this user's daily diabetes metrics and provide a brief health insight:

Today's Data:
- Insulin: ${insulin.toFixed(1)}U
- Carbs: ${Math.round(carbs)}g
- Protein: ${Math.round(protein)}g  
- Fat: ${Math.round(fat)}g
- Meals logged: ${entries}
- ${glucoseText}
- ${historyText}

Provide encouraging, constructive feedback about:
1. Nutrition balance (carb/protein/fat ratio)
2. Insulin management effectiveness
3. Glucose trends if available

Keep it personal, supportive and actionable. Max 2 sentences.`;
}

function getFallbackFeedback(language: string): string {
    const feedbacks = {
        it: [
            "Ottimo lavoro nel monitorare i tuoi valori oggi! Continua così per mantenere la stabilità glicemica. 📊",
            "I tuoi pasti sono ben bilanciati. Ricorda di idratarti e muoverti regolarmente! 💧",
            "Stai gestendo bene l'insulina. Considera di aggiungere più fibre ai prossimi pasti! 🥗",
        ],
        en: [
            "Great job tracking your metrics today! Keep it up for stable glucose levels. 📊",
            "Your meals are well balanced. Remember to stay hydrated and move regularly! 💧",
            "You're managing insulin well. Consider adding more fiber to your next meals! 🥗",
        ]
    };
    
    const list = feedbacks[language as keyof typeof feedbacks] || feedbacks.en;
    return list[Math.floor(Math.random() * list.length)];
}
