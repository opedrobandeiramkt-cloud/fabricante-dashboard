import type { AppUser } from "./auth-types";

/**
 * Usuários mock para desenvolvimento.
 * Em produção, isso vira uma chamada autenticada ao backend (JWT).
 *
 * Senha de todos: "igui2024" (só para dev/demo)
 * Admin: senha "admin2024"
 */
export const MOCK_USERS: AppUser[] = [
  {
    id:             "user-admin",
    name:           "Pedro (Admin)",
    email:          "admin@igui.com.br",
    role:           "admin",
    storeIds:       [], // [] = todas as lojas
    avatarInitials: "PA",
  },
  {
    id:             "user-fab-sp",
    name:           "Carlos Mendes",
    email:          "carlos@igui.com.br",
    role:           "fabricante",
    storeIds:       ["loja-01", "loja-02"], // SP Centro + Campinas
    avatarInitials: "CM",
  },
  {
    id:             "user-fab-pr",
    name:           "Ana Souza",
    email:          "ana@igui.com.br",
    role:           "fabricante",
    storeIds:       ["loja-03"], // Curitiba
    avatarInitials: "AS",
  },
  {
    id:             "user-fab-mg",
    name:           "Roberto Lima",
    email:          "roberto@igui.com.br",
    role:           "fabricante",
    storeIds:       ["loja-04"], // Belo Horizonte
    avatarInitials: "RL",
  },
  {
    id:             "user-fab-rj",
    name:           "Fernanda Costa",
    email:          "fernanda@igui.com.br",
    role:           "fabricante",
    storeIds:       ["loja-05"], // Rio de Janeiro
    avatarInitials: "FC",
  },
  {
    id:             "user-loj-1",
    name:           "Maria Lojista",
    email:          "maria.lojista@igui.com.br",
    role:           "lojista",
    storeIds:       ["loja-01"],
    avatarInitials: "ML",
  },
  {
    id:             "user-v1",
    name:           "João Vendedor",
    email:          "joao.vendedor@igui.com.br",
    role:           "vendedor",
    storeIds:       ["loja-01"],
    avatarInitials: "JV",
    salesGoal:      5,
    crmUserId:      "joao.vendedor@igui.com.br",
  },
  {
    id:             "user-crm-1",
    name:           "Lucas Analista",
    email:          "lucas.analista@igui.com.br",
    role:           "analista_crm",
    storeIds:       ["loja-01", "loja-02"],
    avatarInitials: "LA",
  },
];

/** Senha mock por user id — apenas para simulação local */
const MOCK_PASSWORDS: Record<string, string> = {
  "user-admin":   "admin2024",
  "user-fab-sp":  "igui2024",
  "user-fab-pr":  "igui2024",
  "user-fab-mg":  "igui2024",
  "user-fab-rj":  "igui2024",
  "user-loj-1":   "igui2024",
  "user-v1":      "igui2024",
  "user-crm-1":   "igui2024",
};

export function authenticateUser(
  email: string,
  password: string
): AppUser | null {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) return null;
  if (MOCK_PASSWORDS[user.id] !== password) return null;
  return user;
}
