export class AIService {
    constructor(store) {
        this.store = store;
    }

    async analyzeContent(input, type = 'image', historyContext = []) {
        const settings = this.store.getSettings();
        const apiKey = settings.apiKey;

        // No throw - we allow empty keys now (handled by backend)

        // Point to our local proxy
        const API_URL = '/api/analyze';
        const model = 'sonar-pro';

        // Constructs history context string
        let historyPrompt = "";
        if (settings.smartHistory !== false && historyContext && historyContext.length > 0) {
            const historyItems = historyContext.slice(0, 5).map(h => { // Last 5 items
                return `- ${new Date(h.timestamp).toLocaleDateString()}: Ate ${h.food_name} (${h.carbs}g carbs). Dose: ${h.actual_insulin}u. Result: ${h.post_glucose ? h.post_glucose + ' mg/dL' : 'Unknown'}.`;
            }).join('\n');
            historyPrompt = `\nRELEVANT USER HISTORY:\n${historyItems}\nUse this history to adjust your advice. If the user had high glucose after similar meals, suggest a slightly higher dose or give a warning.`;
        }

        const systemPrompt = `
        You are an expert nutritionist and diabetes assistant. 
        
        TASK:
        ${type === 'image' ? 'Analyze the food in the image provided.' : 'Analyze the food described in the text provided.'}
        
        SAFETY CHECK:
        If the input is NOT related to food, nutrition, or eating (e.g., "Write a poem", "Python code", "General questions"), request REJECT the input.
        Return this specific JSON for rejection:
        { "error": "rejected_non_food", "message": "I can only help with food and insulin calculations." }
        
        If the input IS food related:
        1. Identify all food items and estimate their macronutrients (Carbs, Fat, Protein).
        2. Calculate the total carbohydrates.
        3. Based on the user's Carbon/Insulin ratio of 1 unit per ${settings.carbRatio}g of carbs, calculate the suggested insulin dose.
        4. Analyze the "Nutritional Complexity" to determine if a Split Bolus (Dual Wave) is needed.
           - Rule: If the meal has significant Fat (>20g) AND Protein (>25g), or is known to have a low Glycemic Index due to fat content (e.g., Pizza, Lasagna, Burgers, Creamy Pasta, Fried Chicken), recommend a Split Bolus.
           - Explain WHY in the "reason" field (e.g., "High fat content will delay carb absorption...").
        ${historyPrompt}
        
        CRITICAL: Output strictly JSON format with no markdown formatting.
        Schema:
        {
            "friendly_description": "string (A friendly, enthusiastic, short observation about the food)",
            "food_items": [
                {"name": "string", "carbs": number, "fat": number, "protein": number, "approx_weight": "string"}
            ],
            "total_carbs": number,
            "total_fat": number,
            "total_protein": number,
            "suggested_insulin": number,
            "split_bolus_recommendation": {
                "recommended": boolean,
                "split_percentage": "string (e.g., '50% now / 50% later' or '60% / 40%' based on fat content)",
                "duration": "string (e.g., 'over 2-3 hours')",
                "reason": "string"
            },
            "reasoning": "string (brief explanation)",
            "warnings": ["string"] 
        }
        
        If the food is high in fat (>20g), add a warning about potential delayed absorption.
        `;

        const userContent = [];

        userContent.push({
            type: "text",
            text: systemPrompt
        });

        if (type === 'image') {
            userContent.push({
                type: "image_url",
                image_url: {
                    url: input
                }
            });
        } else {
            userContent.push({
                type: "text",
                text: `FOOD DESCRIPTION: ${input}`
            });
        }

        const payload = {
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI nutritionist assistant. Output JSON only."
                },
                {
                    role: "user",
                    content: userContent
                }
            ],
            temperature: 0.1
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("API Error", err);
                throw new Error(err.error?.message || 'Failed to fetch analysis from AI');
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Cleanup markdown if present
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanContent);

            if (parsed.error === 'rejected_non_food') {
                throw new Error(parsed.message);
            }

            return parsed;

        } catch (error) {
            console.error("AI Service Error:", error);
            throw error;
        }
    }
}
