export interface LibreCredentials {
    email: string;
    password: string;
}

export interface LibreAuthTicket {
    token: string;
    expiresAt: number;
    userId: string;
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
    private static BASE_URL = 'https://api.libreview.io/llu';
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
     */
    static async login(credentials: LibreCredentials): Promise<LibreAuthTicket | null> {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: this.HEADERS,
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });

            if (!response.ok) {
                console.error('Libre login failed:', response.status);
                return null;
            }

            const data = await response.json();

            // Return simplified ticket
            if (data.status !== 0 || !data.data?.authTicket) {
                return null;
            }

            return {
                token: data.data.authTicket.token,
                expiresAt: data.data.authTicket.expires,
                userId: data.data.user.id
            };
        } catch (error) {
            console.error('Libre login error:', error);
            return null;
        }
    }

    /**
     * Get list of connections (patients) - usually just the user themselves
     */
    static async getConnections(token: string): Promise<LibreConnection[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/connections`, {
                headers: {
                    ...this.HEADERS,
                    'authorization': `Bearer ${token}`
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
     * Get glucose graph data for a specific patient
     */
    static async getGlucoseData(token: string, patientId: string): Promise<LibreGlucoseReading[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/connections/${patientId}/graph`, {
                headers: {
                    ...this.HEADERS,
                    'authorization': `Bearer ${token}`
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
