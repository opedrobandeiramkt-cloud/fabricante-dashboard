import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { AppUser, UserRole } from "@/lib/auth-types";

const USE_API   = import.meta.env.VITE_USE_API === "true";
const USERS_KEY = "igui_users";

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as AppUser[];
  } catch { /* ignore */ }
  return [];
}

function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId() {
  return `user-${Date.now()}`;
}

export type UserFormData = {
  name:       string;
  email:      string;
  role:       UserRole;
  storeIds:   string[];
  password:   string;
  salesGoal?: number;
  crmUserId?: string;
};

export function useUsers(_adminId?: string) {
  const [users,   setUsers]   = useState<AppUser[]>(() => USE_API ? [] : loadUsers());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!USE_API) return;
    setLoading(true);
    api.listUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function addUser(data: UserFormData): Promise<AppUser> {
    if (USE_API) {
      const { user } = await api.createUser(data);
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
      salesGoal: data.salesGoal ?? null,
      crmUserId: data.crmUserId ?? null,
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    saveUsers(newUsers);
    return newUser;
  }

  async function updateUser(id: string, data: UserFormData): Promise<void> {
    if (USE_API) {
      const { user } = await api.updateUser(id, data);
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
        salesGoal: data.salesGoal ?? u.salesGoal ?? null,
        crmUserId: data.crmUserId ?? u.crmUserId ?? null,
      }
    );
    setUsers(newUsers);
    saveUsers(newUsers);
  }

  async function deleteUser(id: string): Promise<void> {
    if (USE_API) {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return;
    }

    const newUsers = users.filter((u) => u.id !== id);
    setUsers(newUsers);
    saveUsers(newUsers);
  }

  return { users, loading, addUser, updateUser, deleteUser };
}
