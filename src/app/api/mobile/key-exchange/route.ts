import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, number>();

// Rate limit: 1 request per hour per user
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// API key expiration: 48 hours
const KEY_EXPIRATION_HOURS = 48;

interface KeyExchangeRequest {
    deviceId: string;
    appVersion: string;
    buildNumber: string;
}

interface KeyExchangePayload {
    apiKey: string;
    userId: string;
    deviceId: string;
    expiresAt: string;
    issuedAt: string;
}

/**
 * Phase 1 (MVP): Simple base64 encoding
 * Phase 2: AES-256-GCM encryption
 */
function encryptPayload(payload: KeyExchangePayload): { encryptedKey: string; nonce: string } {
    const secretKey = process.env.KEY_EXCHANGE_SECRET;
    const payloadString = JSON.stringify(payload);

    // Generate random nonce (16 bytes)
    const nonce = crypto.randomBytes(16);

    if (secretKey && secretKey.length >= 32) {
        // Phase 2: Full AES-256-GCM encryption
        const key = Buffer.from(secretKey, "base64").slice(0, 32);
        const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);

        let encrypted = cipher.update(payloadString, "utf8");
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const authTag = cipher.getAuthTag(); // 16 bytes

        // Concatenate encrypted + authTag
        const encryptedWithTag = Buffer.concat([encrypted, authTag]);

        return {
            encryptedKey: encryptedWithTag.toString("base64"),
            nonce: nonce.toString("base64"),
        };
    } else {
        // Phase 1 (MVP): Simple base64 encoding for testing
        console.warn("[KeyExchange] ⚠️ KEY_EXCHANGE_SECRET not configured, using base64 fallback");
        return {
            encryptedKey: Buffer.from(payloadString).toString("base64"),
            nonce: nonce.toString("base64"),
        };
    }
}

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const lastRequest = rateLimitStore.get(userId);

    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
        return false; // Rate limited
    }

    rateLimitStore.set(userId, now);
    return true;
}

// Cleanup old rate limit entries periodically
function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [userId, timestamp] of rateLimitStore.entries()) {
        if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
            rateLimitStore.delete(userId);
        }
    }
}

// Run cleanup every 10 minutes
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate with Clerk
        const { userId } = await auth();

        if (!userId) {
            console.log("[KeyExchange] ❌ Unauthorized - No valid Clerk token");
            return NextResponse.json(
                { error: "Unauthorized", message: "Valid Clerk authentication required" },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body: KeyExchangeRequest = await request.json();
        const { deviceId, appVersion, buildNumber } = body;

        if (!deviceId) {
            return NextResponse.json(
                { error: "Bad Request", message: "deviceId is required" },
                { status: 400 }
            );
        }

        // 3. Check rate limit
        if (!checkRateLimit(userId)) {
            const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
            console.log(`[KeyExchange] ⏳ Rate limited user=${userId}`);
            return NextResponse.json(
                { error: "Too Many Requests", message: "Rate limit exceeded. Try again in 1 hour." },
                {
                    status: 429,
                    headers: { "Retry-After": retryAfter.toString() }
                }
            );
        }

        // 4. Get API key from environment
        const apiKey = process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
            console.error("[KeyExchange] ❌ PERPLEXITY_API_KEY not configured");
            return NextResponse.json(
                { error: "Server Error", message: "API key not configured" },
                { status: 500 }
            );
        }

        // 5. Create payload
        const now = new Date();
        const expiresAt = new Date(now.getTime() + KEY_EXPIRATION_HOURS * 60 * 60 * 1000);

        const payload: KeyExchangePayload = {
            apiKey,
            userId,
            deviceId,
            expiresAt: expiresAt.toISOString(),
            issuedAt: now.toISOString(),
        };

        // 6. Encrypt payload
        const { encryptedKey, nonce } = encryptPayload(payload);

        // 7. Audit log
        const clientIP = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";

        console.log(`[KeyExchange] ✅ Issued key user=${userId} device=${deviceId} app=${appVersion}/${buildNumber} ip=${clientIP} expires=${expiresAt.toISOString()}`);

        // 8. Return encrypted response
        return NextResponse.json({
            encryptedKey,
            nonce,
            expiresAt: expiresAt.toISOString(),
        });

    } catch (error) {
        console.error("[KeyExchange] ❌ Error:", error);
        return NextResponse.json(
            { error: "Server Error", message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: "ok",
        endpoint: "/api/mobile/key-exchange",
        method: "POST",
        requiredHeaders: ["Authorization: Bearer <Clerk JWT>"],
        requiredBody: {
            deviceId: "string (required)",
            appVersion: "string (optional)",
            buildNumber: "string (optional)",
        },
    });
}
