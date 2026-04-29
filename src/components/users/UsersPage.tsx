import { useState } from "react";
import { Plus, Search, Pencil, Trash2, ShieldCheck, Store, AlertTriangle, UserCircle2, UserRound, Building2, BarChart3 } from "lucide-react";
import { UserFormModal } from "./UserFormModal";
import { useUsersContext } from "@/contexts/UsersContext";
import type { UserFormData } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useStores } from "@/contexts/StoresContext";
import type { AppUser } from "@/lib/auth-types";

export function UsersPage() {
  const { user: currentUser, canManageUsers } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useUsersContext();
  const { stores } = useStores();

  const [search,       setSearch]       = useState("");
  const [modalUser,    setModalUser]    = useState<AppUser | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const isLojista = currentUser?.role === "lojista";

  // Lojista vê apenas vendedores vinculados às suas lojas
  const visibleUsers = isLojista
    ? users.filter((u) => u.role === "vendedor" && u.storeIds.some((id) => currentUser?.storeIds.includes(id)))
    : users;

  const filtered = visibleUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(data: UserFormData): Promise<string | null> {
    try {
      if (modalUser === "new") await addUser(data);
      else if (modalUser)      await updateUser(modalUser.id, data);
      setModalUser(null);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar usuário.";
      return msg;
    }
  }

  const adminCount      = visibleUsers.filter((u) => u.role === "admin").length;
  const fabricanteCount = visibleUsers.filter((u) => u.role === "fabricante").length;
  const lojistaCount    = visibleUsers.filter((u) => u.role === "lojista").length;
  const vendedorCount   = visibleUsers.filter((u) => u.role === "vendedor").length;
  const analistaCount   = visibleUsers.filter((u) => u.role === "analista_crm").length;

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {visibleUsers.length} usuário{visibleUsers.length !== 1 ? "s" : ""}
            {adminCount > 0 && <>{" · "}<span className="text-primary">{adminCount} admin</span></>}
            {fabricanteCount > 0 && <>{" · "}<span className="text-[hsl(var(--success))]">{fabricanteCount} fabricante{fabricanteCount !== 1 ? "s" : ""}</span></>}
            {lojistaCount > 0 && <>{" · "}<span className="text-blue-500">{lojistaCount} lojista{lojistaCount !== 1 ? "s" : ""}</span></>}
            {vendedorCount > 0 && <>{" · "}<span className="text-[hsl(var(--warning))]">{vendedorCount} vendedor{vendedorCount !== 1 ? "es" : ""}</span></>}
            {analistaCount > 0 && <>{" · "}<span className="text-purple-500">{analistaCount} analista{analistaCount !== 1 ? "s" : ""}</span></>}
          </p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setModalUser("new")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Busca */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Tabela */}
      <div className="card-base overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 sm:px-5 py-3">Usuário</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 sm:px-5 py-3 hidden sm:table-cell">Perfil</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 sm:px-5 py-3 hidden md:table-cell">Lojas</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 sm:px-5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const storeNames = u.role !== "admin" && u.storeIds.length > 0
                ? stores.filter((s) => u.storeIds.includes(s.id)).map((s) => s.name)
                : null;

              return (
                <tr key={u.id} className={`hover:bg-secondary/20 transition-colors ${isSelf ? "bg-[hsl(var(--primary)/0.04)]" : ""}`}>
                  {/* Usuário */}
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        u.role === "admin"        ? "bg-primary/15 text-primary" :
                        u.role === "vendedor"     ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]" :
                        u.role === "lojista"      ? "bg-blue-500/15 text-blue-500" :
                        u.role === "analista_crm" ? "bg-purple-500/15 text-purple-500" :
                        "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                      }`}>
                        {u.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{u.name}</p>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex-shrink-0">você</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Perfil */}
                  <td className="px-4 sm:px-5 py-3.5 hidden sm:table-cell">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        <ShieldCheck className="h-3 w-3" /> Administrador
                      </span>
                    ) : u.role === "vendedor" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]">
                        <UserRound className="h-3 w-3" /> Vendedor
                      </span>
                    ) : u.role === "lojista" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">
                        <Building2 className="h-3 w-3" /> Lojista
                      </span>
                    ) : u.role === "analista_crm" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500">
                        <BarChart3 className="h-3 w-3" /> Analista CRM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">
                        <Store className="h-3 w-3" /> Fabricante
                      </span>
                    )}
                  </td>

                  {/* Lojas */}
                  <td className="px-4 sm:px-5 py-3.5 hidden md:table-cell">
                    {u.role === "admin" ? (
                      <span className="text-xs text-muted-foreground">Todas as lojas</span>
                    ) : storeNames ? (
                      <div className="flex flex-wrap gap-1">
                        {storeNames.map((name) => (
                          <span key={name} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">
                            {name.replace("iGUi ", "")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[hsl(var(--warning))]">Nenhuma loja</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-4 sm:px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModalUser(u)}
                        className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar usuário"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => !isSelf && setDeleteTarget(u)}
                        disabled={isSelf}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                          isSelf
                            ? "opacity-30 cursor-not-allowed text-muted-foreground"
                            : "hover:bg-[hsl(var(--danger)/0.1)] text-muted-foreground hover:text-[hsl(var(--danger))]"
                        }`}
                        title={isSelf ? "Não é possível excluir sua própria conta" : "Excluir usuário"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 sm:px-5 py-12 text-center">
                  <UserCircle2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de cadastro/edição */}
      {modalUser !== null && (
        <UserFormModal
          user={modalUser === "new" ? null : modalUser}
          onSave={handleSave}
          onClose={() => setModalUser(null)}
        />
      )}

      {/* Confirmação de exclusão */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={async () => { await deleteUser(deleteTarget.id); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({ user, onConfirm, onClose }: {
  user: AppUser; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--danger)/0.12)] flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--danger))]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Excluir usuário?</h3>
            <p className="text-sm text-muted-foreground">Essa ação não pode ser desfeita</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg border border-border">
          O acesso de <span className="font-semibold text-foreground">{user.name}</span> será removido imediatamente.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-medium bg-[hsl(var(--danger))] text-white rounded-lg hover:bg-[hsl(var(--danger)/0.85)] transition-colors">
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}
