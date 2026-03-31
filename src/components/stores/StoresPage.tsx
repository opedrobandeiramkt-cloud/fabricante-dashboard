import { useState } from "react";
import {
  Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Store, MapPin, Phone, Mail, Link2, AlertTriangle, Eye,
} from "lucide-react";
import { StoreFormModal } from "./StoreFormModal";
import { useStores } from "@/hooks/useStores";
import type { Store as StoreType } from "@/lib/types";

interface StoresPageProps {
  readOnly?: boolean;
}

export function StoresPage({ readOnly = false }: StoresPageProps) {
  const { stores, addStore, updateStore, deleteStore, toggleActive } = useStores();

  const [search,       setSearch]       = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [modalStore,   setModalStore]   = useState<StoreType | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreType | null>(null);

  const filtered = stores.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.state.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active"   &&  s.active) ||
      (filterActive === "inactive" && !s.active);
    return matchSearch && matchActive;
  });

  function handleSave(data: Omit<StoreType, "id" | "createdAt">) {
    if (modalStore === "new") {
      addStore(data);
    } else if (modalStore) {
      updateStore(modalStore.id, data);
    }
    setModalStore(null);
  }

  const activeCount   = stores.filter((s) =>  s.active).length;
  const inactiveCount = stores.filter((s) => !s.active).length;

  return (
    <div className="space-y-6">

      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {readOnly ? "Lojas" : "Gerenciar Lojas"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stores.length} loja{stores.length !== 1 ? "s" : ""} cadastrada{stores.length !== 1 ? "s" : ""}
            {" · "}
            <span className="text-[hsl(var(--success))]">{activeCount} ativas</span>
            {inactiveCount > 0 && (
              <span className="text-muted-foreground"> · {inactiveCount} inativas</span>
            )}
          </p>
        </div>
        {readOnly ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-secondary border border-border">
            <Eye className="h-3.5 w-3.5" /> Somente visualização
          </span>
        ) : (
          <button
            onClick={() => setModalStore("new")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Loja
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade ou estado..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filtro de status */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterActive === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Inativas"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de lojas */}
      {filtered.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center py-16 text-center">
          <Store className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma loja encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Tente outro termo de busca" : "Clique em \"Nova Loja\" para começar"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              readOnly={readOnly}
              onEdit={() => setModalStore(store)}
              onDelete={() => setDeleteTarget(store)}
              onToggle={() => toggleActive(store.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de cadastro/edição — apenas admin */}
      {!readOnly && modalStore !== null && (
        <StoreFormModal
          store={modalStore === "new" ? null : modalStore}
          onSave={handleSave}
          onClose={() => setModalStore(null)}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <DeleteConfirmModal
          store={deleteTarget}
          onConfirm={() => {
            deleteStore(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Card de loja ─────────────────────────────────────────────────────────────

function StoreCard({
  store,
  readOnly,
  onEdit,
  onDelete,
  onToggle,
}: {
  store:    StoreType;
  readOnly: boolean;
  onEdit:   () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={`card-base p-5 flex flex-col gap-4 transition-opacity ${
      store.active ? "" : "opacity-60"
    }`}>
      {/* Header do card */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            store.active ? "bg-[hsl(var(--primary)/0.12)]" : "bg-secondary"
          }`}>
            <Store className={`h-5 w-5 ${store.active ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{store.name}</p>
            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
              store.active
                ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                : "bg-secondary text-muted-foreground"
            }`}>
              {store.active ? "Ativa" : "Inativa"}
            </span>
          </div>
        </div>

        {/* Ações — apenas admin */}
        {!readOnly && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggle}
              title={store.active ? "Desativar loja" : "Ativar loja"}
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {store.active
                ? <ToggleRight className="h-4 w-4 text-[hsl(var(--success))]" />
                : <ToggleLeft  className="h-4 w-4" />
              }
            </button>
            <button
              onClick={onEdit}
              title="Editar loja"
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              title="Excluir loja"
              className="h-8 w-8 rounded-lg hover:bg-[hsl(var(--danger)/0.1)] flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--danger))] transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detalhes */}
      <div className="space-y-2 text-sm">
        <InfoRow icon={<MapPin className="h-3.5 w-3.5" />}>
          {store.city} — {store.state}
        </InfoRow>
        {store.phone && (
          <InfoRow icon={<Phone className="h-3.5 w-3.5" />}>{store.phone}</InfoRow>
        )}
        {store.email && (
          <InfoRow icon={<Mail className="h-3.5 w-3.5" />}>
            <span className="truncate">{store.email}</span>
          </InfoRow>
        )}
        {store.externalId && (
          <InfoRow icon={<Link2 className="h-3.5 w-3.5" />}>
            <span className="font-mono text-xs">{store.externalId}</span>
          </InfoRow>
        )}
      </div>

      {/* Rodapé: data de cadastro */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Cadastrada em{" "}
          {new Date(store.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate text-sm">{children}</span>
    </div>
  );
}

// ─── Modal de confirmação de exclusão ─────────────────────────────────────────

function DeleteConfirmModal({
  store,
  onConfirm,
  onClose,
}: {
  store:     StoreType;
  onConfirm: () => void;
  onClose:   () => void;
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
            <h3 className="font-semibold text-foreground">Excluir loja?</h3>
            <p className="text-sm text-muted-foreground">Essa ação não pode ser desfeita</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-lg border border-border">
          Você está prestes a excluir a loja{" "}
          <span className="font-semibold text-foreground">{store.name}</span>.
          Todos os dados de leads e histórico desta loja serão perdidos.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-border"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium bg-[hsl(var(--danger))] text-white rounded-lg hover:bg-[hsl(var(--danger)/0.85)] transition-colors"
          >
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}
