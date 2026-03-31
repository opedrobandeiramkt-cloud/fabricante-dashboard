export type UserRole = "admin" | "fabricante";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeIds: string[]; // [] = acesso a todas (apenas admin)
  avatarInitials: string;
}

export interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
}
