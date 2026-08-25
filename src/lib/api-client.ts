// Forzamos la URL temporalmente para ignorar el caché de Next.js
export const API_BASE_URL = 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchApi<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);
  
  if (!headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireAuth) {
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log("Fetching URL:", url);
  
  try {
    const response = await fetch(url, {
      ...rest,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON. Response text:", text.substring(0, 200));
      throw new Error(`Respuesta no válida del servidor (Status: ${response.status}). Revisa la consola para más detalles.`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Client Error (${endpoint}):`, error);
    throw error;
  }
}
