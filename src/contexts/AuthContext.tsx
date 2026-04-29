import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";
import { authToken } from "@/lib/auth-token";
import type { AppUser } from "@/lib/auth-types";

const STORAGE_KEY = "igui_auth_user";

interface AuthContextValue {
  user:            AppUser | null;
  isAuthenticated: boolean;
  login:           (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:          () => void;
  isAdmin:         boolean;
  isFabricante:    boolean;
  isLojista:       boolean;
  isVendedor:      boolean;
  isAnalistaCRM:   boolean;
  canManageUsers:  boolean;
  canExport:       boolean;
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
    try {
      const { user: found, token } = await api.login(email, password);
      authToken.set(token);
      setUser(found);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "E-mail ou senha incorretos." };
    }
  }

  function logout() {
    authToken.clear();
    setUser(null);
  }

  const isAdmin         = user?.role === "admin";
  const isFabricante    = user?.role === "fabricante";
  const isLojista       = user?.role === "lojista";
  const isVendedor      = user?.role === "vendedor";
  const isAnalistaCRM   = user?.role === "analista_crm";
  const canManageUsers  = isAdmin || isLojista;
  const canExport       = !isVendedor;
  const allowedStoreIds = user?.storeIds ?? [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAdmin,
        isFabricante,
        isLojista,
        isVendedor,
        isAnalistaCRM,
        canManageUsers,
        canExport,
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
