import { create } from 'zustand';

interface User {
  sub: string;
  username: string;
  roles: string[];
  schoolId?: string;
  schoolCode?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: (token: string) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const decoded = JSON.parse(atob(payloadBase64)) as User;
      set({ user: decoded, isAuthenticated: true });
    } catch (e) {
      console.error("Invalid token format");
    }
  },
  
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  }
}));