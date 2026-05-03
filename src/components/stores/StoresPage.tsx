import { useState, useMemo } from "react";
import {
  Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Store, MapPin, Phone, Mail, Link2, AlertTriangle, Copy, Check,
  ChevronRight, ArrowLeft, Users, Webhook,
} from "lucide-react";
import { StoreFormModal } from "./StoreFormModal";
import { CrmConfigModal } from "./CrmConfigModal";
import { useStores } from "@/hooks/useStores";
import { useAuth } from "@/contexts/AuthContext";
import { useUsersContext } from "@/contexts/UsersContext";
import type { Store as StoreType } from "@/lib/types";
import type { StoreType as StoreKind } from "@/lib/store-types";
import type { AppUser } from "@/lib/auth-types";

type StoresView = "fabricantes" | "lojas";

interface StoresPageProps {
  readOnly?: boolean;
}

export function StoresPage({ readOnly = false }: StoresPageProps) {
  const { stores, addStore, updateStore, deleteStore, toggleActive } = useStores();
  const { users, updateUser } = useUsersContext();
  const { user: currentUser, isAdmin, isFabricante } = useAuth();

  const [view,                setView]                = useState<StoresView>(
    // Fabricante vai direto para a lista das suas lojas
    isFabricante ? "lojas" : "fabricantes"
  );
  const [selectedFabricante, setSelectedFabricante]  = useState<AppUser | null | "unassigned">(
    isFabricante ? (currentUser ?? null) : null
  );
  const [search,              setSearch]              = useState("");
  const [filterActive,        setFilterActive]        = useState<"all" | "active" | "inactive">("all");
  const [modalStore,          setModalStore]          = useState<StoreType | null | "new">(null);
  const [deleteTarget,        setDeleteTarget]        = useState<StoreType | null>(null);
  const [crmStore,            setCrmStore]            = useState<StoreType | null>(null);

  // ── Dados derivados ──────────────────────────────────────────────────────────

  const fabricantes = useMemo(
    () => users.filter((u) => u.role === "fabricante"),
    [users]
  );

  const storesByFabricante = useMemo(
    () => fabricantes.map((fab) => ({
      fabricante: fab,
      stores:     stores.filter((s) => fab.storeIds.includes(s.id)),
    })),
    [fabricantes, stores]
  );

  const unassignedStores = useMemo(
    () => stores.filter((s) => !fabricantes.some((fab) => fab.storeIds.includes(s.id))),
    [fabricantes, stores]
  );

  // Lojas da vista atual (fabricante selecionado ou não-atribuídas)
  const currentStores = useMemo(() => {
    if (selectedFabricante === "unassigned") return unassignedStores;
    if (!selectedFabricante) return stores;
    return stores.filter((s) => selectedFabricante.storeIds.includes(s.id));
  }, [selectedFabricante, stores, unassignedStores]);

  const filteredStores = useMemo(() => currentStores.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.state.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active"   &&  s.active) ||
      (filterActive === "inactive" && !s.active);
    return matchSearch && matchActive;
  }), [currentStores, search, filterActive]);

  // ── Ações ────────────────────────────────────────────────────────────────────

  async function handleSave(data: Omit<StoreType, "id" | "createdAt">, storeKind: StoreKind) {
    const withType = { ...data, storeType: storeKind };
    if (modalStore === "new") {
      const newStore = await addStore(withType, currentUser?.id);
      // Vincula ao fabricante selecionado automaticamente
      if (selectedFabricante && selectedFabricante !== "unassigned") {
        await updateUser(selectedFabricante.id, {
          name:           selectedFabricante.name,
          email:          selectedFabricante.email,
          role:           selectedFabricante.role,
          storeIds:       [...selectedFabricante.storeIds, newStore.id],
          password:       "",
          salesGoal:      selectedFabricante.salesGoal ?? undefined,
          crmUserId:      selectedFabricante.crmUserId ?? "",
        });
      }
    } else if (modalStore) {
      await updateStore(modalStore.id, withType, currentUser?.id);
    }
    setModalStore(null);
  }

  function handleSelectFabricante(fab: AppUser | "unassigned") {
    setSelectedFabricante(fab);
    setView("lojas");
    setSearch("");
    setFilterActive("all");
  }

  function handleBack() {
    setView("fabricantes");
    setSelectedFabricante(null);
    setSearch("");
    setFilterActive("all");
  }

  // ── Vista: Cards de Fabricante ───────────────────────────────────────────────

  if (view === "fabricantes") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Lojas por Fabricante</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stores.length} loja{stores.length !== 1 ? "s" : ""} ·{" "}
              {fabricantes.length} fabricante{fabricantes.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setSelectedFabricante(null); setModalStore("new"); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Loja
            </button>
          )}
        </div>

        {fabricantes.length === 0 && unassignedStores.length === 0 ? (
          <div className="card-base flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum fabricante cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Crie fabricantes na aba Usuários primeiro</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {storesByFabricante.map(({ fabricante, stores: fabStores }) => (
              <FabricanteCard
                key={fabricante.id}
                fabricante={fabricante}
                stores={fabStores}
                onClick={() => handleSelectFabricante(fabricante)}
              />
            ))}
            {unassignedStores.length > 0 && (
              <UnassignedCard
                count={unassignedStores.length}
                onClick={() => handleSelectFabricante("unassigned")}
              />
            )}
          </div>
        )}

        {/* Modal sem contexto de fabricante */}
        {isAdmin && modalStore !== null && (
          <StoreFormModal
            store={modalStore === "new" ? null : modalStore}
            initialStoreKind={modalStore !== "new" ? (modalStore.storeType ?? "splash") : "splash"}
            onSave={handleSave}
            onClose={() => setModalStore(null)}
          />
        )}
      </div>
    );
  }

  // ── Vista: Lista de Lojas do Fabricante ──────────────────────────────────────

  const viewTitle =
    selectedFabricante === "unassigned"
      ? "Lojas sem Fabricante"
      : selectedFabricante?.name ?? "Lojas";

  const activeCount   = currentStores.filter((s) =>  s.active).length;
  const inactiveCount = currentStores.filter((s) => !s.active).length;

  return (
    <div className="space-y-6">

      {/* Header com navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isFabricante && (
            <button
              onClick={handleBack}
              className="h-9 w-9 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Voltar para fabricantes"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              {!isFabricante && (
                <button
                  onClick={handleBack}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fabricantes
                </button>
              )}
              {!isFabricante && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <h1 className="text-xl font-bold text-foreground">{viewTitle}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentStores.length} loja{currentStores.length !== 1 ? "s" : ""}
              {" · "}
              <span className="text-[hsl(var(--success))]">{activeCount} ativas</span>
              {inactiveCount > 0 && (
                <span className="text-muted-foreground"> · {inactiveCount} inativas</span>
              )}
            </p>
          </div>
        </div>

        {/* Botão nova loja — admin ou fabricante (somente quando tem contexto) */}
        {!readOnly && isAdmin && selectedFabricante !== null && (
          <button
            onClick={() => setModalStore("new")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Nova Loja
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
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
      {filteredStores.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center py-16 text-center">
          <Store className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma loja encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Tente outro termo de busca" : "Clique em \"Nova Loja\" para começar"}
          </p>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="divide-y divide-border">
            {filteredStores.map((store) => (
              <StoreRow
                key={store.id}
                store={store}
                readOnly={readOnly}
                onEdit={() => setModalStore(store)}
                onDelete={() => setDeleteTarget(store)}
                onToggle={() => toggleActive(store.id)}
                onCrmConfig={isAdmin ? () => setCrmStore(store) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de criação/edição */}
      {!readOnly && isAdmin && modalStore !== null && (
        <StoreFormModal
          store={modalStore === "new" ? null : modalStore}
          initialStoreKind={modalStore !== "new" ? (modalStore.storeType ?? "splash") : "splash"}
          onSave={handleSave}
          onClose={() => setModalStore(null)}
        />
      )}

      {/* Modal de configuração CRM */}
      {isAdmin && crmStore && (
        <CrmConfigModal
          storeId={crmStore.id}
          storeName={crmStore.name}
          onClose={() => setCrmStore(null)}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <DeleteConfirmModal
          store={deleteTarget}
          onConfirm={async () => {
            await deleteStore(deleteTarget.id, currentUser?.id);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Card de Fabricante ───────────────────────────────────────────────────────

function FabricanteCard({
  fabricante,
  stores,
  onClick,
}: {
  fabricante: AppUser;
  stores:     StoreType[];
  onClick:    () => void;
}) {
  const activeCount = stores.filter((s) => s.active).length;
  const states = [...new Set(stores.map((s) => s.state).filter(Boolean))].join(", ");

  return (
    <button
      onClick={onClick}
      className="card-base p-5 text-left hover:border-[hsl(var(--success)/0.4)] hover:bg-[hsl(var(--success)/0.03)] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-full bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:bg-[hsl(var(--success)/0.2)] transition-colors">
          {fabricante.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground truncate">{fabricante.name}</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{fabricante.email}</p>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Store className="h-3 w-3 text-muted-foreground" />
              {stores.length} loja{stores.length !== 1 ? "s" : ""}
            </span>
            {activeCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] font-medium">
                {activeCount} ativa{activeCount !== 1 ? "s" : ""}
              </span>
            )}
            {states && (
              <span className="text-xs text-muted-foreground truncate">{states}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function UnassignedCard({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-base p-5 text-left hover:border-[hsl(var(--warning)/0.4)] hover:bg-[hsl(var(--warning)/0.03)] transition-all group border-dashed"
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-full bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] flex items-center justify-center flex-shrink-0">
          <Store className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground">Sem Fabricante</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Lojas não vinculadas</p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Store className="h-3 w-3 text-muted-foreground" />
              {count} loja{count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Row de loja (vista lista) ────────────────────────────────────────────────

function StoreRow({
  store,
  readOnly,
  onEdit,
  onDelete,
  onToggle,
  onCrmConfig,
}: {
  store:        StoreType;
  readOnly:     boolean;
  onEdit:       () => void;
  onDelete:     () => void;
  onToggle:     () => void;
  onCrmConfig?: () => void;
}) {
  return (
    <div className={`flex items-center gap-4 px-4 sm:px-5 py-3.5 transition-colors hover:bg-secondary/20 ${
      store.active ? "" : "opacity-60"
    }`}>
      {/* Ícone */}
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        store.active ? "bg-[hsl(var(--primary)/0.10)]" : "bg-secondary"
      }`}>
        <Store className={`h-4 w-4 ${store.active ? "text-primary" : "text-muted-foreground"}`} />
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground text-sm truncate">{store.name}</p>
          <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            store.active
              ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
              : "bg-secondary text-muted-foreground"
          }`}>
            {store.active ? "Ativa" : "Inativa"}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {store.city} — {store.state}
          </span>
          {store.phone && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground hidden sm:flex">
              <Phone className="h-3 w-3" />
              {store.phone}
            </span>
          )}
          {store.externalId && (
            <CopyableId value={store.externalId} />
          )}
        </div>
      </div>

      {/* Detalhes extras — desktop */}
      {store.email && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground max-w-[180px]">
          <Mail className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{store.email}</span>
        </div>
      )}

      {/* Ações */}
      {!readOnly && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onCrmConfig && (
            <button
              onClick={onCrmConfig}
              title="Configurar CRM Helena"
              className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <Webhook className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            title={store.active ? "Desativar" : "Ativar"}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {store.active
              ? <ToggleRight className="h-4 w-4 text-[hsl(var(--success))]" />
              : <ToggleLeft  className="h-4 w-4" />
            }
          </button>
          <button
            onClick={onEdit}
            title="Editar"
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            title="Excluir"
            className="h-8 w-8 rounded-lg hover:bg-[hsl(var(--danger)/0.1)] flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--danger))] transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar ID"
      className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
    >
      <Link2 className="h-3 w-3 flex-shrink-0" />
      <span className="font-mono truncate max-w-[80px]">{value}</span>
      {copied ? <Check className="h-3 w-3 text-[hsl(var(--success))]" /> : <Copy className="h-3 w-3" />}
    </button>
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
