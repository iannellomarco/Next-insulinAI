export interface LibreCredentials {
    email: string;
    password: string;
}

export interface LibreAuthTicket {
    token: string;
    expiresAt: number;
    userId: string;
    region?: string; // The base URL that worked for login
}

export interface LibreConnection {
    id: string; // Patient ID
    firstName: string;
    lastName: string;
    targetLow?: number;
    targetHigh?: number;
}

export interface LibreGlucoseReading {
    Value: number; // mg/dL
    Timestamp: string; // "2023-10-27T10:00:00"
    isHigh: boolean;
    isLow: boolean;
    TrendArrow?: number; // 1=Falling, 3=Stable, 5=Rising etc (approx)
}

export class LibreLinkUpClient {
    // List of known regional endpoints to try
    // Order matters: EU is first as it's the likely solution for this user
    private static REGIONS = [
        'https://api-eu.libreview.io/llu', // Europe 
        'https://api.libreview.io/llu',    // Global/US
        'https://api-de.libreview.io/llu', // Germany
        'https://api-fr.libreview.io/llu', // France
        'https://api-jp.libreview.io/llu', // Japan
        'https://api-ae.libreview.io/llu'  // Asia Pacific
    ];

    private static HEADERS = {
        'version': '4.7.0',
        'product': 'llu.ios',
        'culture': 'en-US',
        'accept-encoding': 'gzip, deflate, br',
        'current-time': new Date().toISOString(),
        'content-type': 'application/json'
    };

    /**
     * Login to LibreLinkUp to get an auth ticket (JWT)
     * Iterates through all regions until one works.
     */
    static async login(credentials: LibreCredentials): Promise<LibreAuthTicket | null> {
        console.log('[LibreLinkUp] Starting multi-region login process...');

        for (const baseUrl of this.REGIONS) {
            try {
                console.log(`[LibreLinkUp] Trying region: ${baseUrl}`);
                const response = await fetch(`${baseUrl}/auth/login`, {
                    method: 'POST',
                    headers: this.HEADERS,
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password
                    })
                });

                if (!response.ok) {
                    // If 401, it likely means wrong region (or wrong password, but we assume regions first)
                    // If 404, wrong region.
                    console.warn(`[LibreLinkUp] Login failed on ${baseUrl}: ${response.status}`);
                    continue;
                }

                const data = await response.json();

                if (data.status === 0 && data.data?.authTicket) {
                    console.log(`[LibreLinkUp] Login SUCCESS on ${baseUrl}`);
                    return {
                        token: data.data.authTicket.token,
                        expiresAt: data.data.authTicket.expires,
                        userId: data.data.user.id,
                        region: baseUrl // Store the working region
                    };
                }
            } catch (error) {
                console.warn(`[LibreLinkUp] Network error on ${baseUrl}:`, error);
                // Continue to next region
            }
        }

        console.error('[LibreLinkUp] All regional login attempts failed.');
        return null;
    }

    /**
     * Get list of connections using the region from the ticket
     */
    static async getConnections(ticket: LibreAuthTicket): Promise<LibreConnection[]> {
        const baseUrl = ticket.region || this.REGIONS[0];

        try {
            const response = await fetch(`${baseUrl}/connections`, {
                headers: {
                    ...this.HEADERS,
                    'authorization': `Bearer ${ticket.token}`
                }
            });

            if (!response.ok) return [];

            const data = await response.json();

            if (data.status !== 0 || !data.data) return [];

            return data.data.map((conn: any) => ({
                id: conn.patientId,
                firstName: conn.firstName,
                lastName: conn.lastName,
                targetLow: conn.targetLow,
                targetHigh: conn.targetHigh
            }));
        } catch (error) {
            console.error('Libre getConnections error:', error);
            return [];
        }
    }

    /**
     * Get glucose graph data using the region from the ticket
     */
    static async getGlucoseData(ticket: LibreAuthTicket, patientId: string): Promise<LibreGlucoseReading[]> {
        const baseUrl = ticket.region || this.REGIONS[0];

        try {
            const response = await fetch(`${baseUrl}/connections/${patientId}/graph`, {
                headers: {
                    ...this.HEADERS,
                    'authorization': `Bearer ${ticket.token}`
                }
            });

            if (!response.ok) return [];

            const data = await response.json();

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
    }
}
