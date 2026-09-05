import { create } from "zustand";

export interface User {
  sub: string;
  username: string;
  roles: string[];
  schoolId?: string;
  schoolCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  exp?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  initAuth: () => void;
}

/**
 * Decodifica de forma segura el payload de un token JWT respetando codificación UTF-8.
 */
export function decodeJwt<T = User>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: () => {
    if (typeof window === "undefined") return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const decoded = decodeJwt<User>(token);
      if (!decoded) {
        get().logout();
        return;
      }

      // Validar si el token ya expiró
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        get().logout();
        return;
      }

      set({ user: decoded, isAuthenticated: true, isLoading: false });
    } catch {
      get().logout();
    }
  },

  login: (token: string, refreshToken?: string) => {
    try {
      const decoded = decodeJwt<User>(token);
      if (!decoded) throw new Error("Formato de token no válido");

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        const maxAge = 60 * 60 * 24; // 24 horas
        document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }

      set({ user: decoded, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("Error al iniciar sesión en el store:", err);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));