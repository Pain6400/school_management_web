export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchApi<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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
    } catch {
      console.error("Failed to parse JSON. Response text:", text.substring(0, 200));
      throw new Error(`Respuesta inválida del servidor (Status ${response.status})`);
    }

    if (!response.ok) {
      let msg = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
      if (Array.isArray(msg)) {
        msg = msg.join('. ');
      }
      if (typeof msg === 'string' && (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('uq_'))) {
        msg = 'El registro ya existe en el sistema y no puede duplicarse.';
      }
      throw new Error(msg);
    }

    return data;
  } catch (error: any) {
    let friendlyMessage = error?.message || 'Error desconocido al procesar la solicitud';
    if (friendlyMessage.includes('Failed to fetch') || friendlyMessage.includes('NetworkError') || friendlyMessage.includes('fetch failed')) {
      friendlyMessage = 'No se pudo conectar con el servidor (API en ' + (API_BASE_URL || 'localhost') + '). Asegúrate de que el backend esté en ejecución.';
    }
    console.error(`API Client Error (${endpoint}):`, friendlyMessage);
    throw new Error(friendlyMessage);
  }
}
