import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { MOCK_USERS } from "@/lib/mock-users";
import type { UserFormData } from "@/hooks/useUsers";
import type { AppUser } from "@/lib/auth-types";

const USE_API    = import.meta.env.VITE_USE_API === "true";
const USERS_KEY  = "igui_users";
const PASSWD_KEY = "igui_passwords";

function loadLocalUsers(): AppUser[] {
  try { const r = localStorage.getItem(USERS_KEY); if (r) return JSON.parse(r) as AppUser[]; } catch { /* */ }
  return MOCK_USERS;
}
function loadLocalPasswords(): Record<string, string> {
  try { const r = localStorage.getItem(PASSWD_KEY); if (r) return JSON.parse(r) as Record<string, string>; } catch { /* */ }
  return { "user-admin": "admin2024", "user-fab-sp": "igui2024", "user-fab-pr": "igui2024", "user-fab-mg": "igui2024", "user-fab-rj": "igui2024" };
}

interface UsersContextValue {
  users:            AppUser[];
  loading:          boolean;
  /** Carrega usuários da API. Chamar após login do admin. */
  reloadUsers:      (adminId: string) => Promise<void>;
  addUser:          (data: UserFormData) => Promise<AppUser>;
  updateUser:       (id: string, data: UserFormData) => Promise<void>;
  deleteUser:       (id: string) => Promise<void>;
  authenticateUser: (email: string, password: string) => AppUser | null;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users,     setUsers]     = useState<AppUser[]>(() => USE_API ? [] : loadLocalUsers());
  const [passwords, setPasswords] = useState<Record<string, string>>(() => USE_API ? {} : loadLocalPasswords());
  const [loading,   setLoading]   = useState(false);
  const [adminId,   setAdminId]   = useState<string | undefined>(undefined);

  async function reloadUsers(id: string) {
    if (!USE_API) return;
    setAdminId(id);
    setLoading(true);
    try {
      const data = await api.listUsers(id);
      setUsers(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function addUser(data: UserFormData): Promise<AppUser> {
    if (USE_API) {
      if (!adminId) throw new Error("Admin não autenticado.");
      const { user } = await api.createUser(adminId, data);
      setUsers((prev) => [...prev, user]);
      return user;
    }
    const id = `user-${Date.now()}`;
    const newUser: AppUser = {
      id,
      name:           data.name,
      email:          data.email,
      role:           data.role,
      storeIds:       data.role === "admin" ? [] : data.storeIds,
      avatarInitials: data.name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join(""),
    };
    const newUsers     = [...users, newUser];
    const newPasswords = { ...passwords, [id]: data.password };
    setUsers(newUsers);
    setPasswords(newPasswords);
    localStorage.setItem(USERS_KEY,  JSON.stringify(newUsers));
    localStorage.setItem(PASSWD_KEY, JSON.stringify(newPasswords));
    return newUser;
  }

  async function updateUser(userId: string, data: UserFormData): Promise<void> {
    if (USE_API) {
      if (!adminId) throw new Error("Admin não autenticado.");
      const { user } = await api.updateUser(adminId, userId, data);
      setUsers((prev) => prev.map((u) => (u.id === userId ? user : u)));
      return;
    }
    const newUsers = users.map((u) => u.id !== userId ? u : {
      ...u,
      name:           data.name,
      email:          data.email,
      role:           data.role,
      storeIds:       data.role === "admin" ? [] : data.storeIds,
      avatarInitials: data.name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join(""),
    });
    setUsers(newUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));

    // Sempre persiste o arquivo de senhas para manter sincronizado com USERS_KEY.
    // Atualiza a senha apenas se uma nova foi fornecida.
    const newPasswords = data.password
      ? { ...passwords, [userId]: data.password }
      : { ...passwords };
    if (data.password) setPasswords(newPasswords);
    localStorage.setItem(PASSWD_KEY, JSON.stringify(newPasswords));
  }

  async function deleteUser(userId: string): Promise<void> {
    if (USE_API) {
      if (!adminId) throw new Error("Admin não autenticado.");
      await api.deleteUser(adminId, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return;
    }
    const newUsers     = users.filter((u) => u.id !== userId);
    const newPasswords = { ...passwords };
    delete newPasswords[userId];
    setUsers(newUsers);
    setPasswords(newPasswords);
    localStorage.setItem(USERS_KEY,  JSON.stringify(newUsers));
    localStorage.setItem(PASSWD_KEY, JSON.stringify(newPasswords));
  }

  function authenticateUser(email: string, password: string): AppUser | null {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (passwords[user.id] !== password) return null;
    return user;
  }

  return (
    <UsersContext.Provider value={{ users, loading, reloadUsers, addUser, updateUser, deleteUser, authenticateUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsersContext() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersContext must be used within UsersProvider");
  return ctx;
}
