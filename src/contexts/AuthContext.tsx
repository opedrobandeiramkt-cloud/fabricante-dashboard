import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useUsersContext } from "@/contexts/UsersContext";
import { api } from "@/lib/api";
import type { AppUser } from "@/lib/auth-types";

const USE_API = import.meta.env.VITE_USE_API === "true";

const STORAGE_KEY = "igui_auth_user";

interface AuthContextValue {
  user:            AppUser | null;
  isAuthenticated: boolean;
  login:           (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:          () => void;
  isAdmin:         boolean;
  /** IDs de loja que o usuário tem permissão. [] = todas (admin). */
  allowedStoreIds: string[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authenticateUser } = useUsersContext();
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AppUser) : null;
    } catch {
      return null;
    }
  });

  // Sincroniza com sessionStorage sempre que o user mudar
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  async function login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    if (USE_API) {
      try {
        const { user: found } = await api.login(email, password);
        setUser(found);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "E-mail ou senha incorretos." };
      }
    }

    // Fallback mock (dev sem API)
    await new Promise((r) => setTimeout(r, 600));
    const found = authenticateUser(email, password);
    if (!found) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }
    setUser(found);
    return { success: true };
  }

  function logout() {
    setUser(null);
  }

  const isAdmin         = user?.role === "admin";
  const allowedStoreIds = user?.storeIds ?? [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAdmin,
        allowedStoreIds,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
