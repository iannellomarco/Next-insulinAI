/**
 * Mobile Food Analysis API - Perplexity Primary
 * Uses unified AI Analysis Service with structured outputs
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { 
    analyzeFood, 
    refineQuantity,
    type AnalysisResult,
    getCurrentMealPeriod 
} from '@/lib/ai-analysis-service';
import type { Settings } from '@/types';

// Simple image validation
function validateImage(imageData: string): { valid: boolean; error?: string } {
    if (!imageData) return { valid: false, error: 'No image data' };

    const dataUriPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!dataUriPattern.test(imageData)) {
        return { valid: false, error: 'Invalid format. Use: data:image/jpeg;base64,...' };
    }

    const base64Data = imageData.split(',')[1];
    if (!base64Data || base64Data.length < 100) {
        return { valid: false, error: 'Image data too short' };
    }

    // ~5MB max (base64 encoded)
    if (base64Data.length > 7000000) {
        return { valid: false, error: 'Image too large (max 5MB)' };
    }

    return { valid: true };
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    
    try {
        // Auth
        const [{ userId }, body] = await Promise.all([
            auth(),
            req.json()
        ]);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { text, image, userSettings, mealPeriod, previous_analysis } = body;

        // Validate input
        if (!text && !image && !previous_analysis) {
            return NextResponse.json(
                { error: 'Input required (text, image, or previous_analysis)' },
                { status: 400 }
            );
        }

        // Validate image if present
        if (image) {
            const validation = validateImage(image);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: 'Invalid image', details: validation.error },
                    { status: 400 }
                );
            }
        }

        // Build settings object with defaults
        const settings: Settings = {
            apiKey: '',
            carbRatio: userSettings?.carbRatio || 10,
            carbRatios: userSettings?.carbRatios || { breakfast: 8, lunch: 10, dinner: 12 },
            useMealSpecificRatios: userSettings?.useMealSpecificRatios ?? false,
            correctionFactor: userSettings?.correctionFactor || 50,
            targetGlucose: userSettings?.targetGlucose || 110,
            highThreshold: userSettings?.highThreshold || 180,
            lowThreshold: userSettings?.lowThreshold || 70,
            smartHistory: userSettings?.smartHistory ?? true,
            libreUsername: userSettings?.libreUsername || '',
            librePassword: userSettings?.librePassword || '',
            language: userSettings?.language === 'it' ? 'it' : 'en',
            mealRemindersEnabled: userSettings?.mealRemindersEnabled ?? false,
            reminderTimes: userSettings?.reminderTimes || {
                breakfast: new Date().setHours(8, 30, 0, 0),
                lunch: new Date().setHours(12, 30, 0, 0),
                dinner: new Date().setHours(19, 30, 0, 0),
            },
            analysisMode: userSettings?.analysisMode || 'pplx_only',
        };

        // Override carb ratio for specific meal period if provided
        if (mealPeriod && ['breakfast', 'lunch', 'dinner'].includes(mealPeriod)) {
            if (settings.useMealSpecificRatios && settings.carbRatios) {
                settings.carbRatio = settings.carbRatios[mealPeriod as keyof typeof settings.carbRatios];
            }
        }

        let result: AnalysisResult;
        let provider: string;

        // ========================================
        // CASE 1: Quantity refinement (follow-up)
        // ========================================
        if (previous_analysis && text) {
            console.log('[API] Quantity refinement request');
            
            // Parse quantity locally first for speed
            const parsed = parseQuantityLocally(text, previous_analysis, settings);
            
            if (parsed.success) {
                result = parsed.result;
                provider = 'local-calculation';
            } else {
                // Fallback to AI for complex quantities
                const apiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;
                if (!apiKey) {
                    throw new Error('No API key configured for refinement');
                }
                
                result = await refineQuantity(
                    previous_analysis,
                    text,
                    settings,
                    apiKey,
                    process.env.OPENAI_API_KEY ? 'openai' : 'perplexity'
                );
                provider = 'ai-refinement';
            }
        } else {
            // ========================================
            // CASE 2: Initial analysis
            // ========================================
            console.log('[API] Initial analysis request:', {
                hasImage: !!image,
                hasText: !!text,
                language: settings.language
            });

            const analysis = await analyzeFood({
                text: text || '',
                image: image || null,
                settings,
                provider: 'auto',
                perplexityApiKey: process.env.PERPLEXITY_API_KEY,
                openaiApiKey: process.env.OPENAI_API_KEY,
            });

            result = analysis.result;
            provider = analysis.provider;
        }

        const duration = Date.now() - startTime;
        console.log(`[API] Analysis complete in ${duration}ms via ${provider}`);

        return NextResponse.json({
            ...result,
            _meta: {
                provider,
                duration_ms: duration,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('[API] Error:', error);
        
        // Handle specific error types
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            return NextResponse.json(
                { error: 'API key invalid or expired' },
                { status: 401 }
            );
        }
        
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again in a moment.' },
                { status: 429 }
            );
        }

        if (error.message?.includes('timeout') || error.message?.includes('fetch failed')) {
            return NextResponse.json(
                { error: 'Request timeout. Please check your connection and try again.' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: 'Analysis failed', details: error.message },
            { status: 500 }
        );
    }
}

// Local quantity parser for fast follow-up calculations
function parseQuantityLocally(
    text: string,
    previous: AnalysisResult,
    settings: Settings
): { success: true; result: AnalysisResult } | { success: false } {
    
    const input = text.toLowerCase().trim();
    const baseItem = previous.food_items[0];
    if (!baseItem) return { success: false };

    const baseCarbs = baseItem.carbs;
    const baseFat = baseItem.fat;
    const baseProtein = baseItem.protein;
    const carbRatio = settings.useMealSpecificRatios && settings.carbRatios
        ? settings.carbRatios[getCurrentMealPeriod()]
        : settings.carbRatio;

    let multiplier = 1;
    let description = '1 serving';

    // Try to parse various quantity formats
    
    // "Whole package" / "Tutta la confezione"
    if (/\b(tutt[oa]|inter[oa]|whole|entire|full|tutto)\b/i.test(input)) {
        const weightMatch = baseItem.approx_weight?.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (weightMatch) {
            const totalG = parseFloat(weightMatch[1]);
            multiplier = totalG / 100;
            description = `${totalG}g (whole)`;
        }
    }
    // "Half" / "Metà"
    else if (/\b(metà|mezza|half|mezzo)\b/i.test(input)) {
        multiplier = 0.5;
        description = 'half';
    }
    // "Quarter" / "Un quarto"
    else if (/\b(quarto|quarter|¼)\b/i.test(input)) {
        multiplier = 0.25;
        description = 'quarter';
    }
    // Grams: "150g" / "150 grammi"
    else {
        const gramsMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|grams?|grammi)\b/i);
        if (gramsMatch) {
            const grams = parseFloat(gramsMatch[1]);
            multiplier = grams / 100;
            description = `${grams}g`;
        }
        // Pieces: "3 pieces" / "3 pezzi"
        else {
            const piecesMatch = input.match(/(\d+)\s*(?:pezz[io]|pieces?|items?|unità|unit)/i);
            if (piecesMatch) {
                const pieces = parseInt(piecesMatch[1]);
                // Try to get per-piece weight from approx_weight
                const perPieceMatch = baseItem.approx_weight?.match(/(\d+(?:\.\d+)?)\s*g\s*(?:per|each|\/)/i);
                if (perPieceMatch) {
                    const perPieceG = parseFloat(perPieceMatch[1]);
                    const totalG = pieces * perPieceG;
                    multiplier = totalG / 100;
                    description = `${pieces} pieces (${totalG}g)`;
                } else {
                    // Assume 1 piece = approx_weight or 100g
                    const pieceWeight = baseItem.approx_weight?.includes('g') 
                        ? parseFloat(baseItem.approx_weight.match(/(\d+)/)?.[1] || '100')
                        : 100;
                    multiplier = (pieces * pieceWeight) / 100;
                    description = `${pieces} pieces`;
                }
            }
            // Just a number: "2" or "0.5"
            else {
                const numMatch = input.match(/^(\d+(?:\.\d+)?)$/);
                if (numMatch) {
                    const num = parseFloat(numMatch[1]);
                    if (num > 0 && num <= 50) {
                        multiplier = num;
                        description = num === 1 ? '1 piece' : `${num} pieces`;
                    } else if (num > 50) {
                        multiplier = num / 100;
                        description = `${num}g`;
                    }
                } else {
                    // Can't parse locally
                    return { success: false };
                }
            }
        }
    }

    // Calculate scaled values
    const totalCarbs = Math.round(baseCarbs * multiplier * 10) / 10;
    const totalFat = Math.round(baseFat * multiplier * 10) / 10;
    const totalProtein = Math.round(baseProtein * multiplier * 10) / 10;
    const suggestedInsulin = Math.round((totalCarbs / carbRatio) * 10) / 10;

    const formula = `${totalCarbs}g carbs ÷ ${carbRatio} = ${suggestedInsulin}U`;

    return {
        success: true,
        result: {
            ...previous,
            friendly_description: `${previous.friendly_description} (${description})`,
            food_items: previous.food_items.map(item => ({
                ...item,
                carbs: Math.round(item.carbs * multiplier * 10) / 10,
                fat: Math.round(item.fat * multiplier * 10) / 10,
                protein: Math.round(item.protein * multiplier * 10) / 10,
                approx_weight: description
            })),
            total_carbs: totalCarbs,
            total_fat: totalFat,
            total_protein: totalProtein,
            suggested_insulin: suggestedInsulin,
            missing_info: null,
            calculation_formula: formula,
            reasoning: [`Calculated: ${description} × base values`, formula],
            confidence_level: 'high'
        }
    };
}

// Health check endpoint
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        service: 'mobile-analyze-perplexity',
        perplexityConfigured: !!process.env.PERPLEXITY_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString()
    });
}
