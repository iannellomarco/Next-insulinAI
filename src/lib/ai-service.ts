/**
 * AI Service - Client-side wrapper
 * Maintains backward compatibility while using new unified analysis service
 * @deprecated Use ai-analysis-service.ts for new code
 */

import type { Settings, AnalysisResult } from "@/types";
import { analyzeFood as unifiedAnalyze } from "./ai-analysis-service";

export class AIService {
    /**
     * Analyze food using the unified analysis service
     * This method maintains the old interface for backward compatibility
     */
    static async analyze(
        input: string | File,
        type: 'image' | 'text',
        settings: Settings,
        historyContext: any[] = []
    ): Promise<AnalysisResult> {
        
        // Convert input to text/image
        let text = '';
        let image: string | null = null;
        
        if (type === 'image') {
            if (typeof input === 'string') {
                image = input;
            } else if (input instanceof File) {
                // Convert File to base64
                image = await fileToBase64(input);
            }
        } else {
            text = typeof input === 'string' ? input : '';
        }

        // Call unified service
        const result = await unifiedAnalyze({
            text,
            image,
            settings,
            provider: 'auto',
        });

        // Apply smart history context if enabled
        if (settings.smartHistory && historyContext.length > 0 && result.result.missing_info) {
            // Could enhance missing_info with history context here
        }

        return result.result;
    }

    /**
     * Analyze multiple foods and combine results (for meal chaining)
     */
    static combineResults(results: AnalysisResult[], lang = 'en'): AnalysisResult {
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
            } : { recommended: false, split_percentage: "", duration: "", reason: "" },
            reasoning: [lang === 'it' ? `Combinati ${results.length} elementi per un totale di ${Math.round(totalCarbs)}g di carbo.` : `Combined ${results.length} items totaling ${Math.round(totalCarbs)}g carbs.`],
            calculation_formula: "",
            sources: results.flatMap(r => r.sources || []),
            confidence_level: 'high',
            missing_info: null,
            warnings: results.flatMap(r => r.warnings || [])
        };
    }
}

// Helper to convert File to base64
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Re-export from unified service for convenience
export { analyzeFood, refineQuantity, getCurrentMealPeriod } from './ai-analysis-service';
export type { AnalysisResult as UnifiedAnalysisResult } from './ai-analysis-service';
