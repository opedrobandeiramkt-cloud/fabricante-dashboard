import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authenticateUser } from "@/lib/mock-users";
import type { AppUser } from "@/lib/auth-types";

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
    // Simula latência de rede
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
