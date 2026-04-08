import { useState, useEffect } from "react";
import { MOCK_USERS } from "@/lib/mock-users";
import { api } from "@/lib/api";
import type { AppUser, UserRole } from "@/lib/auth-types";

const USE_API    = import.meta.env.VITE_USE_API === "true";
const USERS_KEY  = "igui_users";
const PASSWD_KEY = "igui_passwords";

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as AppUser[];
  } catch { /* ignore */ }
  return MOCK_USERS;
}

function loadPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWD_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }
  return {
    "user-admin":   "admin2024",
    "user-fab-sp":  "igui2024",
    "user-fab-pr":  "igui2024",
    "user-fab-mg":  "igui2024",
    "user-fab-rj":  "igui2024",
  };
}

function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function savePasswords(passwords: Record<string, string>) {
  localStorage.setItem(PASSWD_KEY, JSON.stringify(passwords));
}

function generateId() {
  return `user-${Date.now()}`;
}

export type UserFormData = {
  name:     string;
  email:    string;
  role:     UserRole;
  storeIds: string[];
  password: string;
};

export function useUsers(adminId?: string) {
  const [users,     setUsers]     = useState<AppUser[]>(() => USE_API ? [] : loadUsers());
  const [passwords, setPasswords] = useState<Record<string, string>>(() => USE_API ? {} : loadPasswords());
  const [loading,   setLoading]   = useState(false);

  // Quando usa API, carrega usuários do backend
  useEffect(() => {
    if (!USE_API || !adminId) return;
    setLoading(true);
    api.listUsers(adminId)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminId]);

  async function addUser(data: UserFormData): Promise<AppUser> {
    if (USE_API) {
      if (!adminId) throw new Error("Admin não autenticado.");
      const { user } = await api.createUser(adminId, data);
      setUsers((prev) => [...prev, user]);
      return user;
    }

    const newUser: AppUser = {
      id:             generateId(),
      name:           data.name,
      email:          data.email,
      role:           data.role,
      storeIds:       data.role === "admin" ? [] : data.storeIds,
      avatarInitials: data.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join(""),
    };
    const newUsers     = [...users, newUser];
    const newPasswords = { ...passwords, [newUser.id]: data.password };
    setUsers(newUsers);
    setPasswords(newPasswords);
    saveUsers(newUsers);
    savePasswords(newPasswords);
    return newUser;
  }

  async function updateUser(id: string, data: UserFormData): Promise<void> {
    if (USE_API) {
      if (!adminId) throw new Error("Admin não autenticado.");
      const { user } = await api.updateUser(adminId, id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      return;
    }

    const newUsers = users.map((u) =>
      u.id !== id ? u : {
        ...u,
        name:     data.name,
        email:    data.email,
        role:     data.role,
        storeIds: data.role === "admin" ? [] : data.storeIds,
        avatarInitials: data.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join(""),
      }
    );
    setUsers(newUsers);
    saveUsers(newUsers);

    if (data.password) {
      const newPasswords = { ...passwords, [id]: data.password };
      setPasswords(newPasswords);
      savePasswords(newPasswords);
    }
  }

  async function deleteUser(id: string): Promise<void> {
    if (USE_API) {
      if (!adminId) throw new Error("Admin não autenticado.");
      await api.deleteUser(adminId, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return;
    }

    const newUsers     = users.filter((u) => u.id !== id);
    const newPasswords = { ...passwords };
    delete newPasswords[id];
    setUsers(newUsers);
    setPasswords(newPasswords);
    saveUsers(newUsers);
    savePasswords(newPasswords);
  }

  function authenticateUser(email: string, password: string): AppUser | null {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (passwords[user.id] !== password) return null;
    return user;
  }

  return { users, loading, addUser, updateUser, deleteUser, authenticateUser };
}
