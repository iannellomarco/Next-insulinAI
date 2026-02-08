// route.ts
import Perplexity from '@perplexity-ai/perplexity_ai';
import { NextRequest, NextResponse } from 'next/server';

const client = new Perplexity({ apiKey: process.env.PERPLEXITY_API_KEY });

// Utility: strict JSON extractor (no hallucinated prose)
function extractJSON(text: string) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in model output');
    return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        // Prompt engineered to FORCE a single-shot structured answer
        const prompt = `You are a nutrition analysis engine.
Return ONLY valid JSON. No prose. No markdown.

Schema:
{
  "item": string,
  "quantity": string,
  "carbs_g": number,
  "calories_kcal": number,
  "confidence": number, // 0-100
  "needs_clarification": boolean
}

Rules:
- If quantity is explicit, needs_clarification=false
- Estimate using typical EU nutrition labels
- Prefer speed over perfection

Query: ${query}`;

        const response = await client.responses.create({
            preset: 'fast-search', // ⚡ fastest possible (1 step)
            input: prompt,
            max_output_tokens: 512,
        });

        const structured = extractJSON(response.output_text ?? '');

        return NextResponse.json({
            ok: true,
            data: structured,
            meta: {
                latency_profile: 'fast-search',
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err.message ?? 'Unknown error' },
            { status: 500 }
        );
    }
}
