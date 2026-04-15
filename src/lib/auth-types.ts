export type UserRole = "admin" | "fabricante" | "vendedor";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeIds: string[]; // [] = acesso a todas (apenas admin)
  avatarInitials: string;
  salesGoal?: number | null;  // meta mensal de vendas (vendedor)
  crmUserId?: string | null;  // ID/email do agente no Helena CRM (vendedor)
}

export interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
}
