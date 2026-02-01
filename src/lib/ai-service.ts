import { Settings, AnalysisResult } from "@/types";

export class AIService {
    static async analyze(
        input: string | File,
        type: 'image' | 'text',
        settings: Settings,
        historyContext: any[] = []
    ): Promise<AnalysisResult> {

        const API_URL = '/api/analyze';
        const model = 'sonar-pro';

        // Optimized compact prompt for token efficiency
        const instructions = `You are a diabetes nutrition assistant.

TASK: Analyze ${type === 'image' ? 'the food image' : 'this food description'} and calculate insulin dose.

RULES:
1. If NOT food-related, return: {"error":"rejected","message":"Food analysis only."}
2. Identify foods, estimate macros, calculate insulin using 1:${settings.carbRatio} carb ratio.
3. Flag split bolus if fat>20g AND protein>25g.
4. IMPORTANT: Preserve the user's specific food name - do NOT generalize "pasta alla carbonara" to "spaghetti". BUT fix obvious typos (e.g., "psta alw carbonara" → "Pasta alla carbonara"). Use proper capitalization.

OUTPUT (valid JSON only, no markdown):
{
  "friendly_description":"User's food name with typos corrected and proper capitalization",
  "food_items":[{"name":"Food name with typos corrected, properly capitalized","carbs":0,"fat":0,"protein":0,"approx_weight":"string"}],
  "total_carbs":0,
  "total_fat":0,
  "total_protein":0,
  "suggested_insulin":0,
  "split_bolus_recommendation":{"recommended":false,"split_percentage":"","duration":"","reason":""},
  "reasoning":["Step 1","Step 2"],
  "warnings":[]
}${settings.smartHistory && historyContext.length > 0 ? `

USER HISTORY (adjust advice accordingly):
${historyContext.slice(0, 3).map(h => `${h.food_items[0]?.name}:${h.total_carbs}g→${h.suggested_insulin}u`).join('; ')}` : ''}`;

        // Construct messages
        const messages: any[] = [
            { role: "system", content: instructions }
        ];

        if (type === 'image' && typeof input === 'string') {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Analyze this food." },
                    { type: "image_url", image_url: { url: input } }
                ]
            });
        } else {
            messages.push({
                role: "user",
                content: `Food: ${input}`
            });
        }

        const payload = { model, messages };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `Request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Extract JSON
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');

        let result;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            result = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
        } else {
            result = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        }

        if (result.error) {
            throw new Error(result.message || "I can only analyze food.");
        }

        if (!result.food_items?.length) {
            throw new Error("No food items identified. Please try again.");
        }

        return result;
    }

    // Analyze multiple foods and combine results (for meal chaining)
    static combineResults(results: AnalysisResult[]): AnalysisResult {
        const allFoodItems = results.flatMap(r => r.food_items);
        const totalCarbs = results.reduce((sum, r) => sum + r.total_carbs, 0);
        const totalFat = results.reduce((sum, r) => sum + r.total_fat, 0);
        const totalProtein = results.reduce((sum, r) => sum + r.total_protein, 0);
        const totalInsulin = results.reduce((sum, r) => sum + r.suggested_insulin, 0);

        // Determine if split bolus needed based on combined totals
        const needsSplit = totalFat > 20 && totalProtein > 25;

        return {
            friendly_description: results.map(r => r.friendly_description).join(' + '),
            food_items: allFoodItems,
            total_carbs: Math.round(totalCarbs * 10) / 10,
            total_fat: Math.round(totalFat * 10) / 10,
            total_protein: Math.round(totalProtein * 10) / 10,
            suggested_insulin: Math.round(totalInsulin * 10) / 10,
            split_bolus_recommendation: needsSplit ? {
                recommended: true,
                split_percentage: "50% upfront, 50% extended",
                duration: "2-3 hours",
                reason: `Combined meal has ${Math.round(totalFat)}g fat and ${Math.round(totalProtein)}g protein.`
            } : { recommended: false },
            reasoning: [`Combined ${results.length} items totaling ${Math.round(totalCarbs)}g carbs.`],
            warnings: results.flatMap(r => r.warnings || [])
        };
    }
}
