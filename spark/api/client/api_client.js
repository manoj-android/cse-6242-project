/**
 * spark/api_client.js
 * SPARK Client API Layer
 * 
 * Manages communication between the frontend interface and the Python backend API
 * (backed directly by SQLite poi.db). Includes request debouncing, structured error
 * mapping (NO_AGE_BAND, INSUFFICIENT_ACTIVITIES), and resilient offline fallback.
 */

class SparkApiError extends Error {
    constructor(code, message, statusCode = 400) {
        super(message);
        this.name = 'SparkApiError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

class SparkApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.serverAvailable = true;
        this.abortController = null;
        this.debounceTimer = null;
    }

    /**
     * Checks if the SPARK Python API server is running and healthy.
     */
    async checkHealth() {
        try {
            const res = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                this.serverAvailable = true;
                return data;
            }
        } catch (e) {
            this.serverAvailable = false;
        }
        return null;
    }

    /**
     * Fetches candidate POIs directly from the SQLite database via API.
     * Falls back to spark/data/offline_pois.json if the Python API server is not running.
     */
    async fetchPois() {
        if (this.serverAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/api/pois`, {
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const pois = await res.json();
                    if (Array.isArray(pois) && pois.length > 0) {
                        return { source: 'sqlite_api', data: pois };
                    }
                }
            } catch (err) {
                console.warn('[SparkApiClient] /api/pois unreachable, falling back to local dataset');
                this.serverAvailable = false;
            }
        }

        // Fallback: static JSON dataset
        try {
            const res = await fetch('data/offline_pois.json');
            if (res.ok) {
                const data = await res.json();
                return { source: 'static_json', data: data };
            }
        } catch (e) {
            console.warn('[SparkApiClient] Local JSON unreachable, using pre-embedded POIs');
        }

        return { source: 'embedded_fallback', data: null };
    }

    /**
     * Fetches CDC pediatric milestone factor weights from poi.db age_points table.
     */
    async fetchAgeProfiles() {
        try {
            const res = await fetch(`${this.baseUrl}/api/age_profiles`, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('[SparkApiClient] /api/age_profiles unavailable');
        }
        return null;
    }

    /**
     * Requests an optimized agenda from the Python Simulated Annealing solver.
     * 
     * @param {Object} params
     * @param {number} params.latitude
     * @param {number} params.longitude
     * @param {string} params.origin_name
     * @param {number} params.child_age
     * @param {number} params.radius_miles
     * @param {number} params.n_activities
     * @param {number} params.distance_penalty
     * @param {number} [params.redundancy_penalty=0.10]
     * @param {boolean} [params.enforce_unique_pois=true]
     * @returns {Promise<Object>} Formatted Service Contract response
     */
    async optimizeAgenda(params) {
        if (!this.serverAvailable) {
            return null; // Signals caller to use embedded client-side solver
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        const payload = {
            latitude: params.latitude,
            longitude: params.longitude,
            origin_name: params.origin_name || 'Caregiver Home',
            child_age: params.child_age !== undefined ? params.child_age : 5.0,
            radius_miles: params.radius_miles !== undefined ? params.radius_miles : 3.0,
            n_activities: params.n_activities || 2,
            distance_penalty: params.distance_penalty !== undefined ? params.distance_penalty : 0.12,
            redundancy_penalty: params.redundancy_penalty !== undefined ? params.redundancy_penalty : 0.10,
            enforce_unique_pois: params.enforce_unique_pois !== undefined ? params.enforce_unique_pois : true
        };

        try {
            const res = await fetch(`${this.baseUrl}/api/optimize_agenda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: this.abortController.signal
            });

            if (res.ok) {
                const data = await res.json();
                return data;
            }

            // Parse structured API error
            const errData = await res.json().catch(() => ({}));
            const errCode = errData.error?.code || 'API_ERROR';
            const errMsg = errData.error?.message || `API returned HTTP ${res.status}`;

            if (res.status === 501) {
                // Static file server fallback
                this.serverAvailable = false;
                return null;
            }

            throw new SparkApiError(errCode, errMsg, res.status);

        } catch (err) {
            if (err.name === 'AbortError') {
                return null; // Request superseded by newer user input
            }
            if (err instanceof SparkApiError) {
                throw err;
            }
            // Network failure or connection refused -> degrade gracefully to client solver
            this.serverAvailable = false;
            return null;
        }
    }
}

// Global client instance
window.SparkApiError = SparkApiError;
window.SparkApiClient = SparkApiClient;
window.sparkApi = new SparkApiClient();

