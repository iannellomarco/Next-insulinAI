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
        // Always use AI for accurate calculation with reasoning
        // ========================================
        if (previous_analysis && text) {
            console.log('[API] Quantity refinement request - using AI reasoning');
            
            // Use OpenAI for precise quantity interpretation and calculation
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OpenAI API key not configured for quantity refinement');
            }
            
            result = await refineQuantity(
                previous_analysis,
                text,
                settings,
                apiKey,
                'openai'
            );
            provider = 'openai-refinement';
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
