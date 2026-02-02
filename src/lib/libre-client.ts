import axios from 'axios';
import { sha256 } from 'js-sha256';

// --- Types adapted from library ---
export interface LibreCredentials {
    email: string;
    password: string;
}

export interface LibreAuthTicket {
    token: string;
    expiresAt: number;
    userId: string;
    region?: string;
}

export interface LibreConnection {
    id: string; // Patient ID
    firstName: string;
    lastName: string;
    targetLow?: number;
    targetHigh?: number;
    patientId?: string; // Library uses patientId sometimes
}

export interface LibreGlucoseReading {
    Value: number;
    Timestamp: string;
    isHigh: boolean;
    isLow: boolean;
    TrendArrow?: number;
}

// Minimal types for internal logic
interface LoginResponse {
    status: number;
    data: {
        user?: { id: string };
        authTicket?: { token: string; expires: number; duration: number };
        redirect?: boolean;
        region?: string;
    };
}

interface RegionalMap {
    [key: string]: { lslApi: string };
}

interface CountryResponse {
    status: number;
    data: {
        regionalMap: RegionalMap;
    };
}

// --- Constants ---
const REGIONS = [
    'https://api-eu.libreview.io', // Europe First
    'https://api.libreview.io',    // Global/US
    'https://api-de.libreview.io', // Germany
    'https://api-fr.libreview.io', // France
    'https://api-jp.libreview.io', // Japan
    'https://api-ae.libreview.io', // Asia Pacific
];

const DEFAULT_HEADERS = {
    'accept-encoding': 'gzip',
    'cache-control': 'no-cache',
    'connection': 'Keep-Alive',
    'content-type': 'application/json',
    'product': 'llu.android',
    'version': '4.12.0',
    'account-id': '',
};

const URL_MAP = {
    login: '/llu/auth/login',
    connections: '/llu/connections',
    countries: '/llu/config/country?country=DE', // Fallback country query
};

/**
 * Factory to create a client instance (DiaKEM style)
 * but with added multi-region capability.
 */
export const createLibreClient = (creds: LibreCredentials) => {
    let jwtToken: string | null = null;
    let accountId: string | null = null;

    // Create axios instance
    const instance = axios.create({
        baseURL: REGIONS[0],
        headers: DEFAULT_HEADERS,
    });

    // Interceptor to inject token and account-id (critical features from library)
    instance.interceptors.request.use(
        config => {
            if (jwtToken && config.headers && accountId) {
                config.headers.authorization = `Bearer ${jwtToken}`;
                config.headers['account-id'] = sha256(accountId);
            }
            return config;
        },
        e => Promise.reject(e)
    );

    /**
     * Core login function logic from library
     */
    const attemptLogin = async (): Promise<LoginResponse | null> => {
        try {
            const response = await instance.post<LoginResponse>(URL_MAP.login, {
                email: creds.email,
                password: creds.password,
            });

            const body = response.data;

            // 1. Check for specific Library logic: 2FA or Consents
            if (body.status === 2) {
                console.warn('LibreLinkUp: Bad credentials (or wrong server)');
                // We return null to allow the multi-region loop to continue trying others
                // UNLESS we are sure it's the right server. 
                // But typically 401/Status 2 on wrong server happens.
                return null;
            }

            // 2. Handle Redirect (Official API feature)
            if (body.data.redirect && body.data.region) {
                console.log(`LibreLinkUp: Redirect requested to ${body.data.region}`);
                try {
                    // Fetch country map to resolve region to URL
                    const countryRes = await instance.get<CountryResponse>(URL_MAP.countries);
                    const regionMap = countryRes.data.data.regionalMap;
                    const regionDef = regionMap[body.data.region];

                    if (regionDef && regionDef.lslApi) {
                        console.log(`LibreLinkUp: Redirecting to ${regionDef.lslApi}`);
                        instance.defaults.baseURL = regionDef.lslApi;
                        // Retry login on new URL
                        return attemptLogin();
                    }
                } catch (e) {
                    console.error('LibreLinkUp: Failed to resolve redirect region', e);
                }
            }

            // 3. Success
            if (body.status === 0 && body.data.authTicket && body.data.user) {
                jwtToken = body.data.authTicket.token;
                accountId = body.data.user.id;
                return body; // Success
            }

            return null;
        } catch (error) {
            // Axios throws on 401/403 usually, or network error
            // console.warn('Login attempt failed:', error);
            return null;
        }
    };

    /**
     * Robust login that iterates regions if the first attempt fails
     */
    const login = async (): Promise<LibreAuthTicket | null> => {
        console.log('[LibreLinkUp] Starting login...');

        // Try current baseURL (default) first? OR iterate all?
        // Let's iterate all to be safe, starting with EU/US
        for (const regionUrl of REGIONS) {
            instance.defaults.baseURL = regionUrl;
            // UPDATE: instance.defaults.baseURL handles future requests, 
            // but we must ensure the loop uses it.

            console.log(`[LibreLinkUp] Trying ${regionUrl}...`);
            const result = await attemptLogin();

            if (result && result.data.authTicket) {
                console.log(`[LibreLinkUp] Connected to ${regionUrl}`);
                return {
                    token: result.data.authTicket.token,
                    expiresAt: result.data.authTicket.expires,
                    userId: result.data.user!.id,
                    region: regionUrl
                };
            }
        }

        console.error('[LibreLinkUp] All regions failed.');
        return null;
    };

    const getConnections = async (): Promise<LibreConnection[]> => {
        try {
            const response = await instance.get(URL_MAP.connections);
            const data = response.data;
            if (data.status !== 0 || !data.data) return [];

            return data.data.map((conn: any) => ({
                id: conn.patientId,
                patientId: conn.patientId,
                firstName: conn.firstName,
                lastName: conn.lastName,
                targetLow: conn.targetLow,
                targetHigh: conn.targetHigh
            }));
        } catch (error) {
            console.error('Libre getConnections error:', error);
            return [];
        }
    };

    const getGlucoseData = async (patientId: string): Promise<LibreGlucoseReading[]> => {
        try {
            const url = `${URL_MAP.connections}/${patientId}/graph`;
            const response = await instance.get(url);
            const data = response.data;

            if (data.status !== 0 || !data.data?.graphData) return [];

            return data.data.graphData.map((reading: any) => ({
                Value: reading.Value,
                Timestamp: reading.Timestamp,
                isHigh: reading.isHigh,
                isLow: reading.isLow,
                TrendArrow: reading.TrendArrow
            }));
        } catch (error) {
            console.error('Libre getGlucoseData error:', error);
            return [];
        }
    };

    // Return the client interface
    return {
        login,
        getConnections,
        getGlucoseData
    };
};
