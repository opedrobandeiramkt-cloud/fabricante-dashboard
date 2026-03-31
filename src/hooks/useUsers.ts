import { useState } from "react";
import { MOCK_USERS } from "@/lib/mock-users";
import type { AppUser, UserRole } from "@/lib/auth-types";

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
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);

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
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  }

  function updateUser(id: string, data: Omit<UserFormData, "password">) {
    setUsers((prev) =>
      prev.map((u) =>
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
      )
    );
  }

  function deleteUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return { users, addUser, updateUser, deleteUser };
}
