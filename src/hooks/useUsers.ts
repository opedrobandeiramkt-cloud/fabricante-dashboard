import { useState } from "react";
import { MOCK_USERS } from "@/lib/mock-users";
import type { AppUser, UserRole } from "@/lib/auth-types";

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
  // senhas padrão dos usuários mock
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

export function useUsers() {
  const [users,     setUsers]     = useState<AppUser[]>(loadUsers);
  const [passwords, setPasswords] = useState<Record<string, string>>(loadPasswords);

  function addUser(data: UserFormData): AppUser {
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
    const newUsers = [...users, newUser];
    const newPasswords = { ...passwords, [newUser.id]: data.password };
    setUsers(newUsers);
    setPasswords(newPasswords);
    saveUsers(newUsers);
    savePasswords(newPasswords);
    return newUser;
  }

  function updateUser(id: string, data: UserFormData) {
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

  function deleteUser(id: string) {
    const newUsers = users.filter((u) => u.id !== id);
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

  return { users, addUser, updateUser, deleteUser, authenticateUser };
}
