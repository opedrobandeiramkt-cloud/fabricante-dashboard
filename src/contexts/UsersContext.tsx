import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { UserFormData } from "@/hooks/useUsers";
import type { AppUser } from "@/lib/auth-types";

const USE_API = import.meta.env.VITE_USE_API === "true";

interface UsersContextValue {
  users:       AppUser[];
  loading:     boolean;
  reloadUsers: (adminId?: string) => Promise<void>;
  addUser:     (data: UserFormData) => Promise<AppUser>;
  updateUser:  (id: string, data: UserFormData) => Promise<void>;
  deleteUser:  (id: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users,   setUsers]   = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);

  async function reloadUsers(_adminId?: string) {
    if (!USE_API) return;
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function addUser(data: UserFormData): Promise<AppUser> {
    const { user } = await api.createUser(data);
    setUsers((prev) => [...prev, user]);
    return user;
  }

  async function updateUser(userId: string, data: UserFormData): Promise<void> {
    const { user } = await api.updateUser(userId, data);
    setUsers((prev) => prev.map((u) => (u.id === userId ? user : u)));
  }

  async function deleteUser(userId: string): Promise<void> {
    await api.deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  return (
    <UsersContext.Provider value={{ users, loading, reloadUsers, addUser, updateUser, deleteUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsersContext() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersContext must be used within UsersProvider");
  return ctx;
}
