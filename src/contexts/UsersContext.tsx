import { createContext, useContext, type ReactNode } from "react";
import { useUsers, type UserFormData } from "@/hooks/useUsers";
import type { AppUser } from "@/lib/auth-types";

interface UsersContextValue {
  users:            AppUser[];
  addUser:          (data: UserFormData) => AppUser;
  updateUser:       (id: string, data: UserFormData) => void;
  deleteUser:       (id: string) => void;
  authenticateUser: (email: string, password: string) => AppUser | null;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const value = useUsers();
  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsersContext() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersContext must be used within UsersProvider");
  return ctx;
}
