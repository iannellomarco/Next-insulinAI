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
        const { insulin, carbs, protein, fat, entries, currentGlucose, language = 'en' } = body;

        const prompt = `Analyze this user's daily diabetes metrics and provide a brief health insight (max 2 sentences):

Today's Data:
- Insulin: ${insulin.toFixed(1)}U
- Carbs: ${Math.round(carbs)}g
- Protein: ${Math.round(protein)}g  
- Fat: ${Math.round(fat)}g
- Meals logged: ${entries}
- Current glucose: ${currentGlucose > 0 ? `${Math.round(currentGlucose)} mg/dL` : 'Not available'}

Provide encouraging, constructive feedback about nutrition balance and glucose management.
Respond in ${language === 'it' ? 'Italian' : 'English'}.`;

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a supportive diabetes health assistant. Provide brief, encouraging health insights.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ feedback: getFallbackFeedback(language) });
        }

        const data = await response.json();
        const feedback = data.choices?.[0]?.message?.content || getFallbackFeedback(language);

        return NextResponse.json({ feedback, timestamp: Date.now() });

    } catch (error) {
        console.error('[Health Feedback] Error:', error);
        return NextResponse.json({ feedback: getFallbackFeedback('en') });
    }
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
