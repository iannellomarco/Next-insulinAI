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

// Structured quantity input for iOS UI buttons
const SuggestedQuantitySchema = z.object({
    label: z.string(),
    value: z.string(),
    type: z.enum(['grams', 'pieces', 'fraction']),
});

const QuantityInfoSchema = z.object({
    input_type: z.enum(['grams', 'pieces', 'package_fraction']),
    total_weight: z.number().optional(),
    pieces: z.number().optional(),
    weight_per_piece: z.number().optional(),
    total_package_weight: z.number().optional(),
    suggested_inputs: z.array(SuggestedQuantitySchema).optional(),
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
    quantity_info: QuantityInfoSchema.nullable().default(null),
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
${language === 'Italian' ? `
=== ITALIAN SUPERMARKET SOURCES ===
For Italian products, search these official supermarket websites:
- TIGROS: https://www.tigros.it ("Spesa online" → "Ingredienti e valori nutrizionali")
- ESSELUNGA: https://www.esselunga.it ("Spesa Online" → "Valori nutrizionali")
- CONAD: https://spesaonline.conad.it ("Valori nutrizionali" block)
- COOP: https://www.easycoop.com ("Valori nutrizionali" table)
- IPER: https://it.everli.com/it/spesa/iper

Priority: Supermarket site > Manufacturer > USDA > Estimation` : `
=== US SUPERMARKET SOURCES ===
For US products, search these official supermarket websites:
- WALMART: https://www.walmart.com/grocery (Pickup/Delivery) - "Nutrition Facts" under product photo
- KROGER: https://www.kroger.com (Shop online) - "Nutrition Facts" section with detailed table
- WHOLE FOODS: https://www.wholefoodsmarket.com (Delivery via Amazon) - FDA standard Nutrition Facts panel
- TARGET: https://www.target.com/c/grocery (Same Day Delivery) - "Nutrition Facts" block, click "View Nutrition"
- INSTACART: https://www.instacart.com (Walmart, Kroger, etc.) - "Nutrition Facts" image or text

Priority: Supermarket site > Manufacturer > USDA > Estimation`}

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
            quantity_info: {
                type: ['object', 'null'],
                description: 'Structured quantity data for UI buttons',
                properties: {
                    input_type: { type: 'string', enum: ['grams', 'pieces', 'package_fraction'] },
                    total_weight: { type: 'number' },
                    pieces: { type: 'number' },
                    weight_per_piece: { type: 'number' },
                    total_package_weight: { type: 'number' },
                    suggested_inputs: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string' },
                                value: { type: 'string' },
                                type: { type: 'string', enum: ['grams', 'pieces', 'fraction'] }
                            },
                            required: ['label', 'value', 'type']
                        }
                    }
                },
                required: ['input_type']
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
            'missing_info', 'quantity_info', 'warnings'
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
        // DEEP SEARCH: More context for better results
        search_context_size: 'high',
        web_search_options: {
            search_context_size: 'high',
            // Include recent results but not too restrictive
            recency_days: 365
        },
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

function generateQuantityInfo(raw: any): any {
    // Extract package weight and pieces info from ALL available sources
    let totalPackageWeight: number | undefined;
    let weightPerPiece: number | undefined;
    let pieces: number | undefined;
    
    // Search in ALL text fields from the analysis
    const searchTexts: string[] = [];
    
    // From food_items - approx_weight is most reliable for package info
    for (const item of (raw.food_items || [])) {
        if (item.approx_weight) searchTexts.push(item.approx_weight);
    }
    
    // From other fields
    if (raw.calculation_formula) searchTexts.push(raw.calculation_formula);
    if (raw.friendly_description) searchTexts.push(raw.friendly_description);
    if (raw.reasoning) searchTexts.push(...(Array.isArray(raw.reasoning) ? raw.reasoning : [raw.reasoning]));
    if (raw.sources) searchTexts.push(...(Array.isArray(raw.sources) ? raw.sources : [raw.sources]));
    if (raw.missing_info) searchTexts.push(raw.missing_info);
    
    const allText = searchTexts.join(' ');
    console.log('[generateQuantityInfo] Searching in text:', allText.substring(0, 200));
    
    // Extract from ALL combined text
    // PRIORITY 1: Pattern "package=360g" or "confezione da 360g" or "360g total"
    const explicitPackageMatch = allText.match(/(?:package|confezione|totale|total)\s*[=:]?\s*(\d{3,4})\s*g/i) ||
                                  allText.match(/(\d{3,4})\s*g\s*(?:total|package|confezione)/i);
    if (explicitPackageMatch) {
        totalPackageWeight = parseInt(explicitPackageMatch[1]);
        console.log('[generateQuantityInfo] Found explicit package weight:', totalPackageWeight);
    }
    
    // PRIORITY 2: Pattern in parentheses like "(360g/3 pieces)" or "(3 pieces, 360g)"
    if (!totalPackageWeight) {
        const parenMatch = allText.match(/\((\d{3,4})\s*g\s*\/\s*\d+\s*(?:pezzi|pieces)/i) ||
                          allText.match(/\(\d+\s*(?:pezzi|pieces)\s*,?\s*(\d{3,4})\s*g/i) ||
                          allText.match(/package[=:]\s*(\d+)\s*g/i);
        if (parenMatch) {
            totalPackageWeight = parseInt(parenMatch[1]);
            console.log('[generateQuantityInfo] Found weight in parentheses:', totalPackageWeight);
        }
    }
    
    // PRIORITY 3: "360g" alone - but be careful to skip "Xg per 100g" or "Xg/100g"
    if (!totalPackageWeight) {
        // Look for "360g" not followed by /100 or "per 100"
        const weightMatches = allText.matchAll(/(\d{3,4})\s*g\b/gi);
        for (const match of weightMatches) {
            const pos = match.index || 0;
            const after = allText.substring(pos + match[0].length, pos + match[0].length + 10).toLowerCase();
            const before = allText.substring(Math.max(0, pos - 10), pos).toLowerCase();
            
            // Skip if it's "per 100g" or "/100g"
            if (after.includes('/100') || after.includes('per 100') || before.includes('per')) {
                continue;
            }
            
            const weight = parseInt(match[1]);
            // Package weight is typically 150g-5000g (not 100g which is standard per-100g)
            if (weight >= 150 && weight <= 5000) {
                totalPackageWeight = weight;
                console.log('[generateQuantityInfo] Found standalone weight:', totalPackageWeight);
                break;
            }
        }
    }
    
    // Pattern: "3 pezzi" or "3 pieces" or "3 per confezione" - look in missing_info FIRST
    // missing_info typically has the cleanest info: "(3 per 360g pack)"
    const missingText = raw.missing_info || '';
    console.log('[generateQuantityInfo] missing_info:', missingText);
    
    // Try patterns in missing_info first
    const missingPiecesMatch = missingText.match(/(\d+)\s*(?:pezzi|pieces|pz)/i) ||
                               missingText.match(/package[=:]?\s*\d+g\s*\/\s*(\d+)\s*(?:pezzi|pieces)/i) ||
                               missingText.match(/(\d+)\s*per\s*(?:confezione|package|pack)/i);
    if (missingPiecesMatch) {
        pieces = parseInt(missingPiecesMatch[1]);
        console.log('[generateQuantityInfo] Found pieces in missing_info:', pieces);
    }
    
    // Fallback to other text
    if (!pieces) {
        const piecesMatch = allText.match(/(\d+)\s*(?:pezzi|pieces|pz)\b(?!\s*\/)/i) ||
                            allText.match(/(\d+)\s*per\s*(?:confezione|package|pack)/i);
        if (piecesMatch) {
            pieces = parseInt(piecesMatch[1]);
            console.log('[generateQuantityInfo] Found pieces in other text:', pieces);
        }
    }
    
    // Pattern: "Xg a pezzo" or "Xg per piece" or "~Xg each" or "each ~Xg"
    const perPieceMatch = allText.match(/(\d+(?:\.\d+)?)\s*g\s*(?:a|per)\s*(?:pezzo|piece)/i) ||
                          allText.match(/(?:each|cad)\s*[~≈]?\s*(\d+(?:\.\d+)?)\s*g/i) ||
                          allText.match(/[~≈]\s*(\d+(?:\.\d+)?)\s*g\s*(?:each|a pezzo)/i) ||
                          allText.match(/\(\s*[~≈]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (perPieceMatch) {
        weightPerPiece = parseFloat(perPieceMatch[1]);
        console.log('[generateQuantityInfo] Found weight per piece:', weightPerPiece);
    }
    
    // Calculate weight per piece if we have total and pieces count
    if (totalPackageWeight && pieces && !weightPerPiece) {
        weightPerPiece = Math.round(totalPackageWeight / pieces);
    }
    
    // Determine input type needed
    const missingLower = (raw.missing_info || '').toLowerCase();
    let inputType: 'grams' | 'pieces' | 'package_fraction' = 'grams';
    
    if (missingLower.includes('pezzi') || missingLower.includes('pieces')) {
        inputType = 'pieces';
    } else if (missingLower.includes('confezione') || missingLower.includes('package')) {
        inputType = 'package_fraction';
    }
    
    // Generate suggested buttons
    const suggestedInputs: any[] = [];
    
    // Product-specific suggestions (PRIORITY)
    if (totalPackageWeight) {
        suggestedInputs.push(
            { label: `📦 Intera confezione (${totalPackageWeight}g)`, value: `${totalPackageWeight}g`, type: 'grams' },
            { label: `½ Metà confezione (${Math.round(totalPackageWeight / 2)}g)`, value: `${Math.round(totalPackageWeight / 2)}g`, type: 'grams' }
        );
        
        // Add 1/3 and 2/3 for larger packages
        if (totalPackageWeight >= 300) {
            suggestedInputs.push(
                { label: `⅓ Un terzo (${Math.round(totalPackageWeight / 3)}g)`, value: `${Math.round(totalPackageWeight / 3)}g`, type: 'grams' }
            );
        }
    }
    
    if (weightPerPiece) {
        // Format: "1 pezzo di 3" or just "1 pezzo" if we don't know total
        let pieceLabel = '';
        if (pieces && pieces > 1) {
            pieceLabel = ` di ${pieces}`;
        }
        suggestedInputs.push(
            { label: `1 pezzo${pieceLabel} (≈${Math.round(weightPerPiece)}g)`, value: '1', type: 'pieces' }
        );
        
        // 2 pieces always useful
        suggestedInputs.push(
            { label: `2 pezzi (≈${Math.round(weightPerPiece * 2)}g)`, value: '2', type: 'pieces' }
        );
        
        // Add more piece options if package has many pieces
        if (pieces && pieces >= 3) {
            suggestedInputs.push(
                { label: `3 pezzi (≈${Math.round(weightPerPiece * 3)}g)`, value: '3', type: 'pieces' }
            );
        }
        if (pieces && pieces >= 4) {
            suggestedInputs.push(
                { label: `4 pezzi (≈${Math.round(weightPerPiece * 4)}g)`, value: '4', type: 'pieces' }
            );
        }
    } else if (pieces && pieces > 1 && totalPackageWeight) {
        // We know pieces but not weight per piece - calculate it
        const calculatedWeightPerPiece = Math.round(totalPackageWeight / pieces);
        suggestedInputs.push(
            { label: `1 pezzo di ${pieces} (≈${calculatedWeightPerPiece}g)`, value: '1', type: 'pieces' },
            { label: `2 pezzi (≈${calculatedWeightPerPiece * 2}g)`, value: '2', type: 'pieces' }
        );
        if (pieces >= 3) {
            suggestedInputs.push(
                { label: `3 pezzi (≈${calculatedWeightPerPiece * 3}g)`, value: '3', type: 'pieces' }
            );
        }
    }
    
    // Only add generic amounts if no specific options exist OR for additional choices
    const hasSpecificOptions = suggestedInputs.length >= 2;
    if (!hasSpecificOptions) {
        // No product info - use standard amounts
        suggestedInputs.push(
            { label: '50g (piccola porzione)', value: '50g', type: 'grams' },
            { label: '100g (porzione standard)', value: '100g', type: 'grams' },
            { label: '150g (porzione media)', value: '150g', type: 'grams' },
            { label: '200g (porzione grande)', value: '200g', type: 'grams' }
        );
    } else {
        // Add a few standard amounts as additional options
        suggestedInputs.push(
            { label: '100g', value: '100g', type: 'grams' },
            { label: '200g', value: '200g', type: 'grams' }
        );
    }
    
    const result = {
        input_type: inputType,
        total_package_weight: totalPackageWeight,
        pieces: pieces,
        weight_per_piece: weightPerPiece,
        suggested_inputs: suggestedInputs.slice(0, 6)  // Max 6 buttons
    };
    
    console.log('[generateQuantityInfo] RESULT:', JSON.stringify(result, null, 2));
    return result;
}

function validateAndFixResult(raw: any, settings: Settings): AnalysisResult {
    // Get current carb ratio for validation
    const carbRatio = settings.useMealSpecificRatios && settings.carbRatios
        ? settings.carbRatios[getCurrentMealPeriod()]
        : settings.carbRatio;
    
    // Generate structured quantity info
    const quantityInfo = generateQuantityInfo(raw);
    
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
        quantity_info: raw.missing_info ? quantityInfo : null,
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
        fixed.suggested_insulin = Math.round((fixed.total_carbs / carbRatio) * 10) / 10;
        fixed.calculation_formula = `${fixed.total_carbs}g carbs ÷ ${carbRatio} = ${fixed.suggested_insulin}U`;
    }
    
    // Validate: if insulin doesn't match formula, log warning but trust AI's calculation
    const expectedInsulin = Math.round((fixed.total_carbs / carbRatio) * 10) / 10;
    if (Math.abs(fixed.suggested_insulin - expectedInsulin) > 0.5) {
        console.warn(`[Validation] Insulin mismatch: AI=${fixed.suggested_insulin}, expected=${expectedInsulin} (ratio=${carbRatio})`);
        // Trust the AI's calculation but ensure formula matches
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
    
    // ESTRAI TUTTO dai dati precedenti - più fonti possibili
    const allText = JSON.stringify(previousAnalysis) + ' ' + 
                    (previousAnalysis.reasoning?.join(' ') || '') + ' ' +
                    (previousAnalysis.sources?.join(' ') || '');
    
    // Cerca peso pacchetto con regex multiple
    let totalPackageWeight = '';
    const weightPatterns = [
        /(\d+(?:\.\d+)?)\s*g\s*(?:package|confezione|pack|total)/i,
        /(?:package|confezione|pack|peso)\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
        /(\d+(?:\.\d+)?)\s*g\b(?![\s]*(?:per|\/|×))/i,
        /(\d{2,4})\s*g/  // 3-4 cifre seguite da g (es. 360g, 1000g)
    ];
    for (const pattern of weightPatterns) {
        const match = allText.match(pattern);
        if (match && parseFloat(match[1]) >= 100) { // Solo pesi >= 100g
            totalPackageWeight = match[1];
            break;
        }
    }
    
    // Cerca numero pezzi
    let piecesInPackage = '';
    const piecesPatterns = [
        /(\d+)\s*(?:pezz|pieces|nuggets|filetti|biscotti)/i,
        /(\d+)\s*per\s*(?:confezione|package|pack)/i,
        /(?:confezione|package).*?(\d+)\s*(?:pezz|pieces)/i
    ];
    for (const pattern of piecesPatterns) {
        const match = allText.match(pattern);
        if (match) {
            piecesInPackage = match[1];
            break;
        }
    }
    
    // Calcola peso per pezzo
    let weightPerPiece = '';
    if (totalPackageWeight && piecesInPackage) {
        weightPerPiece = (parseFloat(totalPackageWeight) / parseInt(piecesInPackage)).toFixed(1);
    }
    
    // Log per debug
    console.log(`[RefineQuantity] Extracted: package=${totalPackageWeight}g, pieces=${piecesInPackage}, perPiece=${weightPerPiece}g`);
    
    const baseCarbs = baseItem?.carbs || 0;
    const baseFat = baseItem?.fat || 0;
    const baseProtein = baseItem?.protein || 0;
    
    // CRITICAL: Check if we have carbs PER PIECE in missing_info
    // Pattern: "each ~9g, 5g carbs" or "~9g / 5g carbs" or "≈5g carbs" or "~ 5g carbs"
    const missingInfoText = previousAnalysis.missing_info || '';
    console.log('[RefineQuantity] missing_info:', missingInfoText);
    
    // Look for carbs per piece - multiple patterns
    let carbsPerPieceMatch = missingInfoText.match(/(\d+(?:\.\d+)?)\s*g\s*(?:carbs?|carboidrati)/i);
    if (!carbsPerPieceMatch) {
        carbsPerPieceMatch = missingInfoText.match(/[~≈]\s*(\d+(?:\.\d+)?)\s*g\s*(?:carbs?|c)/i);
    }
    if (!carbsPerPieceMatch) {
        // Pattern: "5g carbs each" or "each ~5g carbs"
        carbsPerPieceMatch = missingInfoText.match(/(?:each|a pezzo).*?(\d+(?:\.\d+)?)\s*g\s*(?:carbs?|c)/i);
    }
    
    const carbsPerPiece = carbsPerPieceMatch ? parseFloat(carbsPerPieceMatch[1]) : null;
    console.log('[RefineQuantity] carbsPerPiece extracted:', carbsPerPiece);
    
    console.log(`[RefineQuantity] baseCarbs=${baseCarbs}, carbsPerPiece=${carbsPerPiece}, missingInfo="${missingInfoText.substring(0, 100)}"`);
    
    // CALCOLA ESATTAMENTE quello che vuole l'utente
    let targetGrams = 100; // default
    let targetDescription = '100g';
    let numPieces = 0;
    let usePieceCalculation = false;
    
    // Parse la richiesta dell'utente
    const gramsMatch = sanitizedQuantity.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grammi|grams)/i);
    const piecesMatch = sanitizedQuantity.match(/(\d+)\s*(?:pezz|pieces|spinacine|nuggets|biscotti|biscuit)/i);
    const wholeMatch = /\b(whole|full|entire|tutta|tutto|intera|intero)\b/i.test(sanitizedQuantity);
    const halfMatch = /\b(half|metà|mezzo|mezza)\b/i.test(sanitizedQuantity);
    
    if (gramsMatch) {
        // Utente ha specificato grammi - usa calcolo standard
        targetGrams = parseFloat(gramsMatch[1]);
        targetDescription = `${targetGrams}g`;
    } else if (piecesMatch) {
        // Utente ha specificato pezzi
        numPieces = parseInt(piecesMatch[1]);
        usePieceCalculation = true;
        
        if (weightPerPiece) {
            targetGrams = numPieces * parseFloat(weightPerPiece);
            targetDescription = `${numPieces} pieces (${targetGrams.toFixed(1)}g)`;
        } else {
            targetDescription = `${numPieces} pieces`;
            targetGrams = numPieces * 30; // fallback estimate
        }
    } else if (wholeMatch && totalPackageWeight) {
        // Tutto il pacchetto
        targetGrams = parseFloat(totalPackageWeight);
        targetDescription = `whole package (${targetGrams}g)`;
    } else if (halfMatch && totalPackageWeight) {
        // Metà pacchetto
        targetGrams = parseFloat(totalPackageWeight) / 2;
        targetDescription = `half package (${targetGrams}g)`;
    }
    
    // Calcola i valori
    let calcCarbs, calcFat, calcProtein, calcInsulin;
    let calculationFormula;
    
    if (usePieceCalculation && carbsPerPiece && numPieces > 0) {
        // CALCOLO PER PEZZO: se sappiamo che ogni pezzo ha Xg carb
        calcCarbs = Math.round(carbsPerPiece * numPieces * 10) / 10;
        // Per fat/protein, usa proporzione dal base o stima
        const pieceRatio = carbsPerPiece / baseCarbs; 
        calcFat = Math.round(baseFat * pieceRatio * numPieces * 10) / 10;
        calcProtein = Math.round(baseProtein * pieceRatio * numPieces * 10) / 10;
        calcInsulin = Math.round((calcCarbs / carbRatio) * 10) / 10;
        
        calculationFormula = `${carbsPerPiece}g × ${numPieces} pezzi = ${calcCarbs}g ÷ ${carbRatio} = ${calcInsulin}U`;
        
        console.log(`[RefineQuantity] PIECE CALCULATION: ${numPieces} pieces × ${carbsPerPiece}g carbs = ${calcCarbs}g total`);
    } else {
        // CALCOLO STANDARD per grammi
        const multiplier = targetGrams / 100;
        calcCarbs = Math.round(baseCarbs * multiplier * 10) / 10;
        calcFat = Math.round(baseFat * multiplier * 10) / 10;
        calcProtein = Math.round(baseProtein * multiplier * 10) / 10;
        calcInsulin = Math.round((calcCarbs / carbRatio) * 10) / 10;
        
        calculationFormula = `${baseCarbs}g/100g × ${multiplier.toFixed(2)} (${targetGrams}g) = ${calcCarbs}g ÷ ${carbRatio} = ${calcInsulin}U`;
        
        console.log(`[RefineQuantity] GRAM CALCULATION: ${targetGrams}g → ${calcCarbs}g carbs`);
    }
    
    console.log(`[RefineQuantity] FINAL: ${calcCarbs}g carbs, ${calcInsulin}U insulin`);

    // Costruisci esempio specifico per questa richiesta
    const specificExample = {
        friendly_description: `${previousAnalysis.friendly_description} (${targetDescription})`,
        food_items: [{
            name: baseItem?.name || "Product",
            carbs: calcCarbs,
            fat: calcFat,
            protein: calcProtein,
            approx_weight: targetDescription
        }],
        total_carbs: calcCarbs,
        total_fat: calcFat,
        total_protein: calcProtein,
        suggested_insulin: calcInsulin,
        calculation_formula: calculationFormula,
        missing_info: null,
        confidence_level: "high",
        reasoning: usePieceCalculation && carbsPerPiece 
            ? [`${numPieces} pieces × ${carbsPerPiece}g carbs = ${calcCarbs}g`, `Formula: ${calculationFormula}`]
            : [`${targetGrams}g calculated from "${sanitizedQuantity}"`, `Formula: ${calculationFormula}`],
        sources: [previousAnalysis.friendly_description],
        warnings: [],
        split_bolus_recommendation: { recommended: false, split_percentage: "", duration: "", reason: "" }
    };

    // Build calculation section based on type
    const calcSection = usePieceCalculation && carbsPerPiece 
        ? `CARBS PER PIECE: ${carbsPerPiece}g
NUMBER OF PIECES: ${numPieces}
CALCULATION: ${carbsPerPiece}g × ${numPieces} = ${calcCarbs}g carbs
Total fat: ${calcFat}g
Total protein: ${calcProtein}g
Insulin: ${calcCarbs}g ÷ ${carbRatio} = ${calcInsulin}U`
        : `Target weight: ${targetGrams}g
Multiplier: ${targetGrams} ÷ 100 = ${(targetGrams/100).toFixed(4)}
Total carbs: ${baseCarbs}g × ${(targetGrams/100).toFixed(4)} = ${calcCarbs}g
Total fat: ${calcFat}g
Total protein: ${calcProtein}g
Insulin: ${calcCarbs}g ÷ ${carbRatio} = ${calcInsulin}U`;

    const fullPrompt = `You are a JSON formatter. Return the pre-calculated values in the exact JSON format below.

=== PRODUCT INFO ===
Product: ${previousAnalysis.friendly_description}
Base per 100g: Carbs=${baseCarbs}g, Fat=${baseFat}g, Protein=${baseProtein}g
${weightPerPiece ? `Each piece: ${weightPerPiece}g` : ''}
${totalPackageWeight ? `Total package: ${totalPackageWeight}g` : ''}
${piecesInPackage ? `Pieces in pack: ${piecesInPackage}` : ''}

=== PRE-CALCULATED VALUES FOR "${sanitizedQuantity}" ===
${calcSection}

=== REQUIRED JSON OUTPUT ===
${JSON.stringify(specificExample, null, 2)}

INSTRUCTIONS:
1. Return JSON with EXACTLY the values shown above
2. Do NOT recalculate - use the pre-calculated values
3. Format must match the example exactly`;

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
            let description = sanitizedQuantity;
            let totalCarbs, totalFat, totalProtein, insulin, calculationFormula;
            
            // Check for carbs per piece from missing_info
            const fallbackMissingText = previousAnalysis.missing_info || '';
            let fallbackCarbsMatch = fallbackMissingText.match(/(\d+(?:\.\d+)?)\s*g\s*(?:carbs?|carboidrati)/i) ||
                                     fallbackMissingText.match(/[~≈]\s*(\d+(?:\.\d+)?)\s*g\s*(?:carbs?|c)/i) ||
                                     fallbackMissingText.match(/(?:each|a pezzo).*?(\d+(?:\.\d+)?)\s*g\s*(?:carbs?|c)/i);
            const fallbackCarbsPerPiece = fallbackCarbsMatch ? parseFloat(fallbackCarbsMatch[1]) : null;
            
            // Check for pieces in request
            const piecesMatch = sanitizedQuantity.match(/(\d+)\s*(?:pezz|pieces|biscotti|biscuit|item)/i);
            
            if (piecesMatch && fallbackCarbsPerPiece) {
                // Use PER PIECE calculation
                const numPieces = parseInt(piecesMatch[1]);
                totalCarbs = Math.round(fallbackCarbsPerPiece * numPieces * 10) / 10;
                const pieceRatio = fallbackCarbsPerPiece / baseItem.carbs;
                totalFat = Math.round(baseItem.fat * pieceRatio * numPieces * 10) / 10;
                totalProtein = Math.round(baseItem.protein * pieceRatio * numPieces * 10) / 10;
                insulin = Math.round((totalCarbs / carbRatio) * 10) / 10;
                calculationFormula = `${fallbackCarbsPerPiece}g × ${numPieces} = ${totalCarbs}g ÷ ${carbRatio} = ${insulin}U`;
                description = `${numPieces} pieces`;
                
                console.log(`[RefineQuantity] FALLBACK PIECE CALC: ${numPieces} × ${fallbackCarbsPerPiece}g = ${totalCarbs}g`);
            } else {
                // Use GRAM-based calculation
                let multiplier = 1;
                let totalGrams = 100;
                
                const gramsMatch = sanitizedQuantity.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grammi|grams)/i);
                if (gramsMatch) {
                    totalGrams = parseFloat(gramsMatch[1]);
                    multiplier = totalGrams / 100;
                }
                
                totalCarbs = Math.round(baseItem.carbs * multiplier * 10) / 10;
                totalFat = Math.round(baseItem.fat * multiplier * 10) / 10;
                totalProtein = Math.round(baseItem.protein * multiplier * 10) / 10;
                insulin = Math.round((totalCarbs / carbRatio) * 10) / 10;
                calculationFormula = `${baseItem.carbs}g/100g × ${multiplier.toFixed(2)} = ${totalCarbs}g ÷ ${carbRatio} = ${insulin}U`;
            }
            
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
                calculation_formula: calculationFormula,
                missing_info: null,
                confidence_level: 'high',
                reasoning: ['Fallback calculation', calculationFormula],
                sources: ['Fallback: piece-based calculation'],
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
