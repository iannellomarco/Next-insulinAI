/**
 * Unified AI Analysis Service
 * Handles food analysis with Perplexity and OpenAI using structured outputs
 * Features: strict validation, few-shot learning, retry logic, fallback
 */

import { z } from 'zod';
import type { Settings } from '@/types';

// ============================================================================
// ZOD SCHEMAS - Strict validation for AI responses
// ============================================================================

export const FoodItemSchema = z.object({
    name: z.string().min(1, 'Food name is required'),
    carbs: z.number().min(0, 'Carbs must be positive'),
    fat: z.number().min(0, 'Fat must be positive'),
    protein: z.number().min(0, 'Protein must be positive'),
    approx_weight: z.string().nullable().default('100g'),
});

export const SplitBolusSchema = z.object({
    recommended: z.boolean(),
    split_percentage: z.string().default(''),
    duration: z.string().default(''),
    reason: z.string().default(''),
});

export const AnalysisResultSchema = z.object({
    friendly_description: z.string().min(1, 'Description is required'),
    food_items: z.array(FoodItemSchema).min(1, 'At least one food item required'),
    total_carbs: z.number().min(0),
    total_fat: z.number().min(0),
    total_protein: z.number().min(0),
    suggested_insulin: z.number().min(0),
    split_bolus_recommendation: SplitBolusSchema,
    reasoning: z.array(z.string()).default([]),
    calculation_formula: z.string().default(''),
    sources: z.array(z.string()).default([]),
    confidence_level: z.enum(['high', 'medium', 'low']),
    missing_info: z.string().nullable().default(null),
    warnings: z.array(z.string()).default([]),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type FoodItem = z.infer<typeof FoodItemSchema>;

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Model configurations
const MODELS = {
    perplexity: {
        primary: 'sonar-pro',
        fallback: 'sonar',
    },
    openai: {
        primary: 'gpt-4o-mini',  // More reliable for structured outputs
        fallback: 'gpt-4o',
    },
};

// Retry configuration
const RETRY_CONFIG = {
    maxAttempts: 2,
    delayMs: 500,
};

// ============================================================================
// FEW-SHOT EXAMPLES - Show the AI exactly what we expect
// ============================================================================

const ITALIAN_EXAMPLES = `
=== ESEMPI DI ANALISI CORRETTE ===

Esempio 1 - Prodotto confezionato con etichetta:
Input: Foto di confezione di biscotti Gocciole
Output atteso:
{
  "friendly_description": "Gocciole Biscotti",
  "food_items": [{
    "name": "Gocciole - Biscotti con gocce di cioccolato",
    "carbs": 68.5,
    "fat": 21.0,
    "protein": 6.5,
    "approx_weight": "100g"
  }],
  "total_carbs": 68.5,
  "total_fat": 21.0,
  "total_protein": 6.5,
  "suggested_insulin": 0,
  "missing_info": "Quanti biscotti hai mangiato? (ogni biscotto = ~7g carboidrati)",
  "calculation_formula": "Info per 100g: 68.5g carb. In attesa della quantità consumata.",
  "confidence_level": "high",
  "sources": ["Etichetta nutrizionale visibile nell'immagine"]
}

Esempio 2 - Quantità specifica:
Input: "Ho mangiato 3 gocciole"
Output atteso:
{
  "friendly_description": "3 Gocciole",
  "food_items": [{
    "name": "Gocciole",
    "carbs": 21.0,
    "fat": 6.3,
    "protein": 1.95,
    "approx_weight": "3 pezzi (~30g)"
  }],
  "total_carbs": 21.0,
  "suggested_insulin": 2.6,
  "missing_info": null,
  "calculation_formula": "21.0g carb ÷ 8 (rapporto colazione) = 2.6U",
  "confidence_level": "high"
}

Esempio 3 - Cibo senza etichetta:
Input: Foto di piatto di pasta al pomodoro
Output atteso:
{
  "friendly_description": "Pasta al pomodoro",
  "food_items": [{
    "name": "Pasta al pomodoro",
    "carbs": 45.0,
    "fat": 8.0,
    "protein": 9.0,
    "approx_weight": "pORZione media (~250g)"
  }],
  "total_carbs": 45.0,
  "suggested_insulin": 4.5,
  "missing_info": "La porzione sembra essere di circa 250g. Confermi questa quantità?",
  "calculation_formula": "45.0g carb stimati ÷ 10 = 4.5U",
  "confidence_level": "medium",
  "sources": ["Stima visiva + database USDA"]
}
`;

const ENGLISH_EXAMPLES = `
=== CORRECT ANALYSIS EXAMPLES ===

Example 1 - Packaged product with label:
Input: Photo of Oreo cookies package
Expected output:
{
  "friendly_description": "Oreo Cookies",
  "food_items": [{
    "name": "Oreo Original Chocolate Sandwich Cookies",
    "carbs": 67.0,
    "fat": 20.0,
    "protein": 5.0,
    "approx_weight": "100g"
  }],
  "total_carbs": 67.0,
  "total_fat": 20.0,
  "total_protein": 5.0,
  "suggested_insulin": 0,
  "missing_info": "How many cookies did you eat? (each cookie = ~8.5g carbs)",
  "calculation_formula": "Per 100g: 67g carbs. Waiting for quantity consumed.",
  "confidence_level": "high",
  "sources": ["Nutrition label visible in image"]
}

Example 2 - Specific quantity:
Input: "I ate 4 oreos"
Expected output:
{
  "friendly_description": "4 Oreo Cookies",
  "food_items": [{
    "name": "Oreo Cookies",
    "carbs": 34.0,
    "fat": 10.2,
    "protein": 2.5,
    "approx_weight": "4 cookies (~51g)"
  }],
  "total_carbs": 34.0,
  "suggested_insulin": 3.4,
  "missing_info": null,
  "calculation_formula": "34.0g carbs ÷ 10 (ratio) = 3.4U",
  "confidence_level": "high"
}

Example 3 - Food without label:
Input: Photo of homemade pasta dish
Expected output:
{
  "friendly_description": "Pasta with tomato sauce",
  "food_items": [{
    "name": "Pasta with tomato sauce",
    "carbs": 48.0,
    "fat": 9.0,
    "protein": 10.0,
    "approx_weight": "medium portion (~280g)"
  }],
  "total_carbs": 48.0,
  "suggested_insulin": 4.8,
  "missing_info": "The portion appears to be about 280g. Can you confirm this quantity?",
  "calculation_formula": "Estimated 48g carbs ÷ 10 = 4.8U",
  "confidence_level": "medium",
  "sources": ["Visual estimation + USDA database"]
}
`;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildSystemPrompt(settings: Settings, isImage: boolean): string {
    const language = settings.language === 'it' ? 'Italian' : 'English';
    const examples = settings.language === 'it' ? ITALIAN_EXAMPLES : ENGLISH_EXAMPLES;
    
    const carbRatio = settings.useMealSpecificRatios && settings.carbRatios
        ? settings.carbRatios[getCurrentMealPeriod()]
        : settings.carbRatio;

    return `You are a precise diabetes nutrition assistant. Your task is to analyze food and calculate insulin doses.

LANGUAGE: ${language}
INSULIN RATIO: 1 unit per ${carbRatio}g of carbs

${examples}

=== CRITICAL RULES ===
1. OCR PRIORITY: If you see a nutrition label, EXTRACT EXACT VALUES. Never estimate when text is visible.
2. SPLIT BOLUS: If fat > 20g AND protein > 25g, recommend split bolus (50% now, 50% over 2-3 hours).
3. QUANTITY LOGIC:
   - If you know carbs per item (e.g., 7g per cookie) but NOT how many: set insulin=0, ask in missing_info
   - If you have total weight (e.g., "100g pasta"): calculate insulin normally
   - If estimating visually: set confidence=medium/low and ask for confirmation
4. FRIENDLY_DESCRIPTION: MAX 3-4 words. Examples: "Gocciole Biscuits", "Pasta al pomodoro", "Apple"
5. CALCULATION_FORMULA: Always show the math clearly
6. SOURCES: List where data came from (OCR, USDA, estimation, etc.)

=== WHEN TO SET missing_info ===
- "Quanti pezzi/ne hai mangiato?" / "How many pieces did you eat?"
- "Quanti grammi?" / "How many grams?"
- "Confermi che è una porzione media (~250g)?" / "Confirm this is a medium portion (~250g)?"

Never leave missing_info empty if insulin=0 and food is recognized.`;
}

function buildUserMessage(text: string, image: string | null, isImage: boolean): any {
    if (isImage && image) {
        return {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: text?.trim() 
                        ? `${text}\n\nAnalyze this food image carefully. Extract ALL visible nutritional data from labels.`
                        : 'Analyze this food image carefully. Extract ALL visible nutritional data from labels.'
                },
                {
                    type: 'image_url',
                    image_url: { url: image }
                }
            ]
        };
    }
    
    return {
        role: 'user',
        content: `Analyze this food: "${text}"`
    };
}

// ============================================================================
// JSON SCHEMA FOR STRUCTURED OUTPUTS
// ============================================================================

const ANALYSIS_JSON_SCHEMA = {
    name: 'food_analysis',
    strict: true,
    schema: {
        type: 'object',
        properties: {
            friendly_description: {
                type: 'string',
                description: 'Short food name (max 3-4 words)'
            },
            food_items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        carbs: { type: 'number' },
                        fat: { type: 'number' },
                        protein: { type: 'number' },
                        approx_weight: { type: ['string', 'null'] }
                    },
                    required: ['name', 'carbs', 'fat', 'protein', 'approx_weight'],
                    additionalProperties: false
                }
            },
            total_carbs: { type: 'number' },
            total_fat: { type: 'number' },
            total_protein: { type: 'number' },
            suggested_insulin: { type: 'number' },
            split_bolus_recommendation: {
                type: 'object',
                properties: {
                    recommended: { type: 'boolean' },
                    split_percentage: { type: 'string' },
                    duration: { type: 'string' },
                    reason: { type: 'string' }
                },
                required: ['recommended', 'split_percentage', 'duration', 'reason'],
                additionalProperties: false
            },
            reasoning: {
                type: 'array',
                items: { type: 'string' }
            },
            calculation_formula: { type: 'string' },
            sources: {
                type: 'array',
                items: { type: 'string' }
            },
            confidence_level: {
                type: 'string',
                enum: ['high', 'medium', 'low']
            },
            missing_info: {
                type: ['string', 'null'],
                description: 'Question to ask user if quantity is unknown'
            },
            warnings: {
                type: 'array',
                items: { type: 'string' }
            }
        },
        required: [
            'friendly_description', 'food_items', 'total_carbs', 'total_fat',
            'total_protein', 'suggested_insulin', 'split_bolus_recommendation',
            'reasoning', 'calculation_formula', 'sources', 'confidence_level',
            'missing_info', 'warnings'
        ],
        additionalProperties: false
    }
};

// ============================================================================
// API CALLS WITH RETRY
// ============================================================================

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callPerplexity(
    text: string,
    image: string | null,
    settings: Settings,
    apiKey: string,
    attempt = 1
): Promise<AnalysisResult> {
    const isImage = !!image;
    const systemPrompt = buildSystemPrompt(settings, isImage);
    const userMessage = buildUserMessage(text, image, isImage);

    const payload = {
        model: attempt === 1 ? MODELS.perplexity.primary : MODELS.perplexity.fallback,
        messages: [
            { role: 'system', content: systemPrompt },
            userMessage
        ],
        max_tokens: 2048,
        temperature: 0.1,
        response_format: {
            type: 'json_schema',
            json_schema: ANALYSIS_JSON_SCHEMA
        }
    };

    try {
        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Perplexity API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from Perplexity');
        }

        // Parse and validate
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        const validated = validateAndFixResult(parsed, settings);
        
        return validated;

    } catch (error) {
        if (attempt < RETRY_CONFIG.maxAttempts) {
            console.log(`[Perplexity] Retry ${attempt + 1}/${RETRY_CONFIG.maxAttempts}...`);
            await sleep(RETRY_CONFIG.delayMs);
            return callPerplexity(text, image, settings, apiKey, attempt + 1);
        }
        throw error;
    }
}

async function callOpenAI(
    text: string,
    image: string | null,
    settings: Settings,
    apiKey: string,
    attempt = 1
): Promise<AnalysisResult> {
    const isImage = !!image;
    const systemPrompt = buildSystemPrompt(settings, isImage);
    const userMessage = buildUserMessage(text, image, isImage);

    const payload: any = {
        model: attempt === 1 ? MODELS.openai.primary : MODELS.openai.fallback,
        messages: [
            { role: 'system', content: systemPrompt },
            userMessage
        ],
        max_completion_tokens: 2048,
        temperature: 0.1,
        response_format: {
            type: 'json_schema',
            json_schema: ANALYSIS_JSON_SCHEMA
        }
    };

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from OpenAI');
        }

        // Parse and validate
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        const validated = validateAndFixResult(parsed, settings);
        
        return validated;

    } catch (error) {
        if (attempt < RETRY_CONFIG.maxAttempts) {
            console.log(`[OpenAI] Retry ${attempt + 1}/${RETRY_CONFIG.maxAttempts}...`);
            await sleep(RETRY_CONFIG.delayMs);
            return callOpenAI(text, image, settings, apiKey, attempt + 1);
        }
        throw error;
    }
}

// ============================================================================
// VALIDATION & FIXES
// ============================================================================

function validateAndFixResult(raw: any, settings: Settings): AnalysisResult {
    // Ensure all required fields exist with defaults
    const fixed = {
        friendly_description: raw.friendly_description || 'Unknown food',
        food_items: Array.isArray(raw.food_items) ? raw.food_items.map((item: any) => ({
            name: item.name || 'Unknown item',
            carbs: Number(item.carbs) || 0,
            fat: Number(item.fat) || 0,
            protein: Number(item.protein) || 0,
            approx_weight: item.approx_weight || '100g'
        })) : [],
        total_carbs: Number(raw.total_carbs) || 0,
        total_fat: Number(raw.total_fat) || 0,
        total_protein: Number(raw.total_protein) || 0,
        suggested_insulin: Number(raw.suggested_insulin) || 0,
        split_bolus_recommendation: {
            recommended: Boolean(raw.split_bolus_recommendation?.recommended),
            split_percentage: raw.split_bolus_recommendation?.split_percentage || '',
            duration: raw.split_bolus_recommendation?.duration || '',
            reason: raw.split_bolus_recommendation?.reason || ''
        },
        reasoning: Array.isArray(raw.reasoning) ? raw.reasoning : [],
        calculation_formula: raw.calculation_formula || '',
        sources: Array.isArray(raw.sources) ? raw.sources : [],
        confidence_level: ['high', 'medium', 'low'].includes(raw.confidence_level) 
            ? raw.confidence_level 
            : 'medium',
        missing_info: raw.missing_info || null,
        warnings: Array.isArray(raw.warnings) ? raw.warnings : []
    };

    // Validate with Zod
    const result = AnalysisResultSchema.safeParse(fixed);
    
    if (!result.success) {
        console.warn('[Validation] Zod validation warnings:', result.error.issues);
    }

    // CRITICAL FIX: Ensure missing_info is set if insulin is 0 but food is recognized
    if (fixed.suggested_insulin === 0 && fixed.food_items.length > 0 && !fixed.missing_info) {
        fixed.missing_info = settings.language === 'it'
            ? "Quanti grammi o pezzi hai mangiato?"
            : "How many grams or pieces did you eat?";
        fixed.warnings.push("Auto-generated quantity question");
    }

    // Calculate insulin if missing but carbs are present
    if (fixed.suggested_insulin === 0 && fixed.total_carbs > 0 && !fixed.missing_info) {
        const carbRatio = settings.useMealSpecificRatios && settings.carbRatios
            ? settings.carbRatios[getCurrentMealPeriod()]
            : settings.carbRatio;
        fixed.suggested_insulin = Math.round((fixed.total_carbs / carbRatio) * 10) / 10;
        fixed.calculation_formula = `${fixed.total_carbs}g carbs ÷ ${carbRatio} = ${fixed.suggested_insulin}U`;
    }

    // Ensure totals match food_items
    const calculatedCarbs = fixed.food_items.reduce((sum: number, item: FoodItem) => sum + item.carbs, 0);
    const calculatedFat = fixed.food_items.reduce((sum: number, item: FoodItem) => sum + item.fat, 0);
    const calculatedProtein = fixed.food_items.reduce((sum: number, item: FoodItem) => sum + item.protein, 0);

    if (Math.abs(calculatedCarbs - fixed.total_carbs) > 0.1) {
        console.warn(`[Validation] Carbs mismatch: items=${calculatedCarbs}, total=${fixed.total_carbs}`);
        fixed.total_carbs = calculatedCarbs;
    }

    return fixed as AnalysisResult;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCurrentMealPeriod(): 'breakfast' | 'lunch' | 'dinner' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    return 'dinner';
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface AnalysisOptions {
    text: string;
    image?: string | null;
    settings: Settings;
    provider?: 'perplexity' | 'openai' | 'auto';
    perplexityApiKey?: string;
    openaiApiKey?: string;
}

export async function analyzeFood(options: AnalysisOptions): Promise<{
    result: AnalysisResult;
    provider: string;
    fromCache: boolean;
}> {
    const { text, image, settings, provider = 'auto' } = options;
    
    const perplexityKey = options.perplexityApiKey || process.env.PERPLEXITY_API_KEY;
    const openaiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;

    // Determine which provider to use
    const usePerplexityFirst = (provider === 'auto' || provider === 'perplexity') && perplexityKey;
    const useOpenAIFirst = (provider === 'auto' || provider === 'openai') && openaiKey;

    // Try Perplexity first if preferred
    if (usePerplexityFirst) {
        try {
            console.log('[AI Service] Using Perplexity...');
            const result = await callPerplexity(text, image || null, settings, perplexityKey!);
            return { result, provider: 'perplexity', fromCache: false };
        } catch (error: any) {
            console.error('[AI Service] Perplexity failed:', error.message);
            
            // Fallback to OpenAI if available and auto mode
            if (openaiKey && provider === 'auto') {
                console.log('[AI Service] Falling back to OpenAI...');
                const result = await callOpenAI(text, image || null, settings, openaiKey);
                return { result, provider: 'openai (fallback)', fromCache: false };
            }
            throw error;
        }
    }

    // Try OpenAI if preferred or as fallback
    if (useOpenAIFirst) {
        try {
            console.log('[AI Service] Using OpenAI...');
            const result = await callOpenAI(text, image || null, settings, openaiKey!);
            return { result, provider: 'openai', fromCache: false };
        } catch (error: any) {
            console.error('[AI Service] OpenAI failed:', error.message);
            
            // Fallback to Perplexity if available and auto mode
            if (perplexityKey && provider === 'auto') {
                console.log('[AI Service] Falling back to Perplexity...');
                const result = await callPerplexity(text, image || null, settings, perplexityKey);
                return { result, provider: 'perplexity (fallback)', fromCache: false };
            }
            throw error;
        }
    }

    throw new Error('No AI provider available. Configure PERPLEXITY_API_KEY or OPENAI_API_KEY.');
}

// Quantity refinement for follow-up requests
// Uses AI reasoning instead of regex parsing for complex quantity understanding
export async function refineQuantity(
    previousAnalysis: AnalysisResult,
    quantityText: string,
    settings: Settings,
    apiKey: string,
    provider: 'openai' | 'perplexity' = 'openai'
): Promise<AnalysisResult> {
    
    // Sanitize quantityText - extract just the user's input if it contains formatting
    let sanitizedQuantity = quantityText;
    
    // If the text contains [REFINEMENT] marker, extract just the relevant part
    if (quantityText.includes('[REFINEMENT]') || quantityText.includes('User says:')) {
        const match = quantityText.match(/User says:\s*"([^"]+)"/i);
        if (match) {
            sanitizedQuantity = match[1];
        } else {
            // Take last line or just first few words
            const lines = quantityText.split('\n').filter(l => l.trim());
            sanitizedQuantity = lines[lines.length - 1] || quantityText.substring(0, 50);
        }
    }
    
    // Limit length to avoid token issues
    sanitizedQuantity = sanitizedQuantity.substring(0, 100).trim();
    
    const language = settings.language === 'it' ? 'Italian' : 'English';
    const carbRatio = settings.useMealSpecificRatios && settings.carbRatios
        ? settings.carbRatios[getCurrentMealPeriod()]
        : settings.carbRatio;

    const baseItem = previousAnalysis.food_items[0];
    
    // Try to extract total package weight from previous analysis
    let totalPackageWeight = '';
    const searchText = `${previousAnalysis.calculation_formula} ${previousAnalysis.sources?.join(' ') || ''} ${baseItem?.approx_weight || ''}`;
    const weightMatch = searchText.match(/(\d+(?:\.\d+)?)\s*g\b(?!\s*per|\/100)/i) || 
                        searchText.match(/confezione.*?\s(\d+)\s*g/i) ||
                        searchText.match(/package.*?\s(\d+)\s*g/i);
    if (weightMatch) {
        totalPackageWeight = weightMatch[1] + 'g';
    }
    
    // Compact prompt - avoid token limits
    const prompt = `Calculate nutrition for: "${sanitizedQuantity}"

Product: ${previousAnalysis.friendly_description}
Base per 100g: Carbs=${baseItem?.carbs}g Fat=${baseItem?.fat}g Protein=${baseItem?.protein}g
${totalPackageWeight ? `Total package weight: ${totalPackageWeight}` : 'Reference: 100g'}
Insulin ratio: 1:${carbRatio}

Examples:
- "380g" with 14g/100g → (14÷100)×380=53.2g carbs
- "whole package" with 380g total → (14÷100)×380=53.2g carbs  ← USE TOTAL WEIGHT
- "half" of 380g → (14÷100)×190=26.6g

Rules:
1. Parse quantity (grams, pieces, whole, half, etc.)
2. If user says "whole package"/"tutta la confezione" → use TOTAL PACKAGE WEIGHT
3. Scale ALL nutrients proportionally
4. Calculate insulin: total_carbs÷${carbRatio}
5. Show formula: "Xg carbs/100g × Y = Zg ÷ ${carbRatio} = W.U"
6. Set missing_info=null

Language: ${language}`;

    // Build prompt with JSON example for OpenAI
    const jsonExample = {
        friendly_description: `Product name (${sanitizedQuantity})`,
        food_items: [{
            name: "Product name",
            carbs: 53.2,
            fat: 24.0,
            protein: 30.0,
            approx_weight: "380g"
        }],
        total_carbs: 53.2,
        total_fat: 24.0,
        total_protein: 30.0,
        suggested_insulin: 5.3,
        calculation_formula: "14g/100g × 3.8 = 53.2g ÷ 10 = 5.3U",
        missing_info: null,
        confidence_level: "high",
        reasoning: ["Parsed quantity: 380g", "Calculated: (14÷100)×380=53.2g carbs"],
        sources: ["Original analysis"],
        warnings: [],
        split_bolus_recommendation: { recommended: false, split_percentage: "", duration: "", reason: "" }
    };

    const fullPrompt = `${prompt}

=== REQUIRED JSON OUTPUT FORMAT ===
${JSON.stringify(jsonExample, null, 2)}

IMPORTANT: Return ONLY the JSON object above with calculated values. No extra text.`;

    const payload: any = {
        model: provider === 'openai' ? MODELS.openai.primary : MODELS.perplexity.primary,
        messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: `Calculate for: "${sanitizedQuantity}"` }
        ],
        temperature: 0.1
    };

    const apiUrl = provider === 'openai' ? OPENAI_API_URL : PERPLEXITY_API_URL;
    
    console.log(`[RefineQuantity] Using ${provider} for: "${sanitizedQuantity}" (original: "${quantityText.substring(0, 50)}...")`);
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[RefineQuantity] ${provider} error ${response.status}:`, errorText);
        throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
        throw new Error('Empty response from AI');
    }
    
    let parsed;
    try {
        // Try to extract JSON from response (handle markdown code blocks)
        let jsonContent = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                          content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonContent = jsonMatch[1] || jsonMatch[0];
        }
        parsed = JSON.parse(jsonContent);
        console.log('[RefineQuantity] Parsed JSON successfully:', JSON.stringify(parsed, null, 2).substring(0, 500));
    } catch (e) {
        console.error('[RefineQuantity] JSON parse error, raw content:', content);
        throw new Error('Invalid JSON from AI');
    }
    
    // Fallback: if AI returned empty result, calculate manually
    if (!parsed.food_items || parsed.food_items.length === 0) {
        console.warn('[RefineQuantity] AI returned empty food_items, using fallback calculation');
        const baseItem = previousAnalysis.food_items[0];
        if (baseItem) {
            let multiplier = 1;
            let description = sanitizedQuantity;
            
            // Try to extract grams from quantity text
            const gramsMatch = sanitizedQuantity.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grammi|grams)/i);
            if (gramsMatch) {
                multiplier = parseFloat(gramsMatch[1]) / 100;
            }
            // Check for "whole package" / "tutta la confezione"
            else if (/\b(whole|entire|tutta|tutto|intera|intero)\b/i.test(sanitizedQuantity)) {
                // Find total package weight from previous analysis
                const searchText = `${previousAnalysis.calculation_formula} ${previousAnalysis.sources?.join(' ') || ''}`;
                const packageWeightMatch = searchText.match(/(\d+(?:\.\d+)?)\s*g\b(?!\s*per|\/100)/i);
                if (packageWeightMatch) {
                    const totalGrams = parseFloat(packageWeightMatch[1]);
                    multiplier = totalGrams / 100;
                    description = `${totalGrams}g (whole package)`;
                }
            }
            // Check for "half"
            else if (/\b(half|metà|mezzo|mezza)\b/i.test(sanitizedQuantity)) {
                const searchText = `${previousAnalysis.calculation_formula} ${previousAnalysis.sources?.join(' ') || ''}`;
                const packageWeightMatch = searchText.match(/(\d+(?:\.\d+)?)\s*g\b(?!\s*per|\/100)/i);
                if (packageWeightMatch) {
                    multiplier = (parseFloat(packageWeightMatch[1]) / 100) / 2;
                    description = `half (${parseFloat(packageWeightMatch[1]) / 2}g)`;
                } else {
                    multiplier = 0.5;
                    description = 'half';
                }
            }
            
            const totalCarbs = Math.round(baseItem.carbs * multiplier * 10) / 10;
            const totalFat = Math.round(baseItem.fat * multiplier * 10) / 10;
            const totalProtein = Math.round(baseItem.protein * multiplier * 10) / 10;
            const insulin = Math.round((totalCarbs / carbRatio) * 10) / 10;
            
            parsed = {
                friendly_description: `${previousAnalysis.friendly_description} (${description})`,
                food_items: [{
                    name: baseItem.name,
                    carbs: totalCarbs,
                    fat: totalFat,
                    protein: totalProtein,
                    approx_weight: description
                }],
                total_carbs: totalCarbs,
                total_fat: totalFat,
                total_protein: totalProtein,
                suggested_insulin: insulin,
                calculation_formula: `${baseItem.carbs}g/100g × ${multiplier.toFixed(2)} = ${totalCarbs}g ÷ ${carbRatio} = ${insulin}U`,
                missing_info: null,
                confidence_level: 'high',
                reasoning: ['Fallback calculation', `${baseItem.carbs}g × ${multiplier} = ${totalCarbs}g`],
                sources: ['Fallback: original analysis × quantity'],
                warnings: ['AI returned empty, used fallback calculation'],
                split_bolus_recommendation: { recommended: false, split_percentage: '', duration: '', reason: '' }
            };
        }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[RefineQuantity] Completed in ${duration}ms`);
    
    return validateAndFixResult(parsed, settings);
}

export { getCurrentMealPeriod };
