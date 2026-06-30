import { supabase } from '@/integrations/supabase/client';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';
const IS_DEV = import.meta.env.DEV;

interface RequestConfig extends RequestInit {
    skipAuth?: boolean;
}

/**
 * API Client with automatic JWT token injection
 * Uses Supabase session tokens for authentication with Spring Boot backend
 */
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private sessionPromise: Promise<Session | null> | null = null;

    public async safeGetSession() {
        if (this.sessionPromise) return this.sessionPromise;

        this.sessionPromise = (async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                return session;
            } catch (err) {
                console.warn('[API] getSession failed, attempting localStorage fallback:', err);
                try {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                            const stored = localStorage.getItem(key);
                            if (stored) {
                                const parsed = JSON.parse(stored);
                                if (parsed?.access_token) {
                                    return { access_token: parsed.access_token } as any;
                                }
                            }
                        }
                    }
                } catch (fallbackErr) {
                    console.error('[API] LocalStorage fallback failed:', fallbackErr);
                }
                return null;
            } finally {
                // Clear the promise after a short delay to allow fresh checks later
                // but keep it long enough to deduplicate concurrent bursts
                setTimeout(() => { this.sessionPromise = null; }, 1000);
            }
        })();

        return this.sessionPromise;
    }

    private async getAuthHeaders(): Promise<HeadersInit> {
        if (IS_DEV) console.log('[API] Getting auth headers...');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const session = await this.safeGetSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            if (IS_DEV) console.log('[API] Token found, length:', session.access_token.length);
        } else {
            console.warn('[API] No session/token available');
        }

        return headers;
    }

    private async handleResponse<T>(response: Response, skipAuth?: boolean): Promise<T> {
        const timestamp = new Date().toISOString();

        if (response.status === 401) {
            // If this was a public/skipAuth request, do NOT redirect to login.
            // Guest users hitting public endpoints should never be forced to log in.
            if (skipAuth) {
                console.warn(`[API ${timestamp}] 401 on public request - ignoring (guest user)`);
                throw new Error('Authentication required for this resource.');
            }

            console.error(`[API ${timestamp}] 401 Unauthorized - Session expired or invalid`);
            
            // Perform signOut safely - don't let a lock timeout here block the failure
            try {
                // Use a non-blocking timeout for signOut to avoid long hangs
                const signOutPromise = supabase.auth.signOut();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('SignOut timeout')), 2000)
                );
                
                Promise.race([signOutPromise, timeoutPromise]).catch(e => 
                    console.warn('[API] Safe signOut non-blocking error:', e.message)
                );
            } catch (e) {
                console.warn('[API] signOut failed:', e);
            }

            // Only redirect to login for authenticated requests that failed
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }

        if (!response.ok) {
            console.error(`[API ${timestamp}] Request failed with status ${response.status}`);
            const errorData = await response.json().catch(() => ({}));
            console.error(`[API ${timestamp}] Error details:`, errorData);
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            if (IS_DEV) console.log(`[API ${timestamp}] 204 No Content - Empty response`);
            return {} as T;
        }

        const data = await response.json();
        if (IS_DEV) console.log(`[API ${timestamp}] Response data received`, typeof data === 'object' ? `(${Object.keys(data).length} keys)` : '');
        return data;
    }

    async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        const headers = config?.skipAuth ? { 'Content-Type': 'application/json' } : await this.getAuthHeaders();
        const fullUrl = `${this.baseUrl}${endpoint}`;
        const timestamp = new Date().toISOString();

        if (IS_DEV) {
            console.log(`[API ${timestamp}] 🔵 GET Request`);
            console.log(`  URL: ${fullUrl}`);
            console.log(`  Auth: ${config?.skipAuth ? 'No' : 'Yes'}`);
        }

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers,
            ...config,
        });

        if (IS_DEV) console.log(`[API ${timestamp}] 🔵 GET Response - Status: ${response.status} ${response.statusText}`);
        return this.handleResponse<T>(response, config?.skipAuth);
    }

    async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
        const headers = config?.skipAuth ? { 'Content-Type': 'application/json' } : await this.getAuthHeaders();
        const fullUrl = `${this.baseUrl}${endpoint}`;
        const timestamp = new Date().toISOString();

        if (IS_DEV) {
            console.log(`[API ${timestamp}] 🟢 POST Request`);
            console.log(`  URL: ${fullUrl}`);
            console.log(`  Body:`, data);
        }

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });

        if (IS_DEV) console.log(`[API ${timestamp}] 🟢 POST Response - Status: ${response.status} ${response.statusText}`);
        return this.handleResponse<T>(response, config?.skipAuth);
    }

    async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
        const headers = config?.skipAuth ? { 'Content-Type': 'application/json' } : await this.getAuthHeaders();
        const fullUrl = `${this.baseUrl}${endpoint}`;
        const timestamp = new Date().toISOString();

        if (IS_DEV) {
            console.log(`[API ${timestamp}] 🟡 PUT Request`);
            console.log(`  URL: ${fullUrl}`);
            console.log(`  Body:`, data);
        }

        const response = await fetch(fullUrl, {
            method: 'PUT',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });

        if (IS_DEV) console.log(`[API ${timestamp}] 🟡 PUT Response - Status: ${response.status} ${response.statusText}`);
        return this.handleResponse<T>(response, config?.skipAuth);
    }

    async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        const headers = config?.skipAuth ? { 'Content-Type': 'application/json' } : await this.getAuthHeaders();
        const fullUrl = `${this.baseUrl}${endpoint}`;
        const timestamp = new Date().toISOString();

        if (IS_DEV) {
            console.log(`[API ${timestamp}] 🔴 DELETE Request`);
            console.log(`  URL: ${fullUrl}`);
        }

        const response = await fetch(fullUrl, {
            method: 'DELETE',
            headers,
            ...config,
        });

        if (IS_DEV) console.log(`[API ${timestamp}] 🔴 DELETE Response - Status: ${response.status} ${response.statusText}`);
        return this.handleResponse<T>(response, config?.skipAuth);
    }

    // Special method for file uploads (multipart/form-data)
    async uploadFile<T>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> {
        const headers: HeadersInit = {};
        
        const session = await this.safeGetSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const formData = new FormData();
        formData.append(fieldName, file);

        // Don't set Content-Type - browser will set it with boundary for multipart
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        return this.handleResponse<T>(response);
    }
}

// Export singleton instance
const apiClient = new ApiClient(BASE_URL);

export default apiClient;
export { ApiClient };
