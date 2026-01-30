const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
    status: number;
    body: any;

    constructor(status: number, message: string, body?: any) {
        super(message);
        this.status = status;
        this.body = body;
        this.name = 'ApiError';
    }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    console.log(`[API] Fetching: ${API_URL}${endpoint}`);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        // Gestion des statuts de succès sans contenu
        if (response.status === 204 || response.status === 205) {
            console.log(`[API] Success (${response.status}): No content`);
            return null;
        }

        // Lire le corps de la réponse
        const text = await response.text();
        let data = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch (parseError) {
            console.warn('[API] Failed to parse response as JSON:', text);
        }

        // Gestion des erreurs HTTP
        if (!response.ok) {
            console.error(`[API] Error (${response.status}):`, data || text);
            throw new ApiError(
                response.status,
                data?.message || response.statusText || 'Une erreur est survenue',
                data
            );
        }

        console.log(`[API] Success (${response.status})`);
        return data;

    } catch (error) {
        // Erreur réseau (serveur inaccessible)
        if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error('[API] Network error: Cannot reach server');
            throw new ApiError(
                0,
                'Impossible de se connecter au serveur. Vérifiez que l\'API est démarrée sur ' + API_URL,
                { originalError: error.message }
            );
        }

        // Re-throw ApiError ou autres erreurs
        throw error;
    }
}
