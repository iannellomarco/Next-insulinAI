import { Settings, AnalysisResult } from "@/types";

export class AIService {
    static async analyze(
        input: string | File,
        type: 'image' | 'text',
        settings: Settings,
        historyContext: any[] = []
    ): Promise<AnalysisResult> {

        const API_URL = '/api/analyze';
        // User confirmed 'sonar-pro' is desired.
        const model = 'sonar-pro';

        // Construct System Instructions
        let instructions = `
    You are an expert nutritionist and diabetes assistant. 
    
    TASK:
    ${type === 'image' ? 'Analyze the food in the image provided.' : 'Analyze the food described in the text provided.'}
    
    SAFETY CHECK:
    If the input is NOT related to food, nutrition, or eating (e.g., "Write a poem", "Python code"), REJECT the input.
    Return: { "error": "rejected_non_food", "message": "I can only help with food." }
    
    If the input IS food related:
    1. Identify all food items and estimate macronutrients.
    2. Calculate total carbs.
    3. Based on the user's Carbon/Insulin ratio of 1 unit per ${settings.carbRatio}g of carbs, calculate the suggested insulin dose.
    4. Analyze for Split Bolus (High Fat > 20g AND Protein > 25g).
    
    CRITICAL: Output strictly VALID JSON format. No markdown ticks.
    Schema:
    {
        "friendly_description": "string",
        "food_items": [
            {"name": "string", "carbs": number, "fat": number, "protein": number, "approx_weight": "string"}
        ],
        "total_carbs": number,
        "total_fat": number,
        "total_protein": number,
        "suggested_insulin": number,
        "split_bolus_recommendation": {
            "recommended": boolean,
            "split_percentage": "string",
            "duration": "string",
            "reason": "string"
        },
        "reasoning": ["string"]
    }
        "warnings": ["string"] 
    }
    `;

        // History injection
        if (settings.smartHistory && historyContext.length > 0) {
            const historyItems = historyContext.slice(0, 5).map(h => {
                return `- ${new Date(h.timestamp).toLocaleDateString()}: Ate ${h.food_items[0]?.name} (${h.total_carbs}g carbs). Dose: ${h.suggested_insulin}u.`;
            }).join('\n');
            instructions += `\n\nRELEVANT USER HISTORY:\n${historyItems}\nUse this history to adjust your advice.`;
        }

        // Construct Messages Payload
        const messages: any[] = [
            { role: "system", content: instructions }
        ];

        if (type === 'image' && typeof input === 'string') {
            // content is array for vision
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Analyze this image." },
                    { type: "image_url", image_url: { url: input } }
                ]
            });
        } else {
            // content is string for text
            messages.push({
                role: "user",
                content: `FOOD DESCRIPTION: ${input}`
            });
        }

        const payload = {
            model: model,
            messages: messages
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}` // Might be empty or invalid, route.ts handles fallback
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Robust JSON extraction: Find the first '{' and the last '}'
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');

        let result;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = content.substring(jsonStart, jsonEnd + 1);
            result = JSON.parse(jsonString);
        } else {
            // Fallback to cleaning if no braces found (unlikely for valid JSON but safe to keep)
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanContent);
        }

        // Validation: Check if the AI rejected the input
        if (result.error) {
            throw new Error(result.message || "I can only analyze food. Please try again.");
        }

        // Validation: Ensure structure is valid
        if (!result.food_items || !Array.isArray(result.food_items) || result.food_items.length === 0) {
            throw new Error("No food items identified. Please try a clearer description or image.");
        }

        return result;
    }
}
