import { useState, useMemo, useEffect } from "react";
import {
  BarChart3, Store, LogOut, ChevronDown, ShieldCheck, Users,
  Download, Menu, FileText, TrendingUp,
} from "lucide-react";
import logoSvg from "@/assets/logo.svg";

import { KPICards }            from "@/components/dashboard/KPICards";
import { FunnelChart }         from "@/components/dashboard/FunnelChart";
import { TrendChart }          from "@/components/dashboard/TrendChart";
import { StoreRanking }        from "@/components/dashboard/StoreRanking";
import { StoreFilter }         from "@/components/dashboard/StoreFilter";
import { StageTimeChart }      from "@/components/dashboard/StageTimeChart";
import { SalesGoalProgress }   from "@/components/dashboard/SalesGoalProgress";
import { VendedorDashboard }   from "@/components/dashboard/VendedorDashboard";
import { StoresPage }          from "@/components/stores/StoresPage";
import { UsersPage }           from "@/components/users/UsersPage";
import { OrcamentosPage }      from "@/components/orcamentos/OrcamentosPage";
import { useOrcamentos }       from "@/contexts/OrcamentosContext";
import { LoginPage }           from "@/components/auth/LoginPage";
import { ResetPasswordPage }   from "@/components/auth/ResetPasswordPage";
import { useAuth }        from "@/contexts/AuthContext";
import { useDashboard }   from "@/hooks/useDashboard";
import { PERIOD_LABELS } from "@/lib/constants";
import { useStores } from "@/contexts/StoresContext";
import { useUsersContext } from "@/contexts/UsersContext";
import { exportDashboardPDF } from "@/lib/export-pdf";
import type { Period }    from "@/lib/types";

const PERIODS: Period[] = ["7d", "30d", "90d", "12m"];
type Page = "dashboard" | "stores" | "users";
type DashboardTab = "metricas" | "orcamentos";

export default function App() {
  const { isAuthenticated } = useAuth();

  const resetToken = new URLSearchParams(window.location.search).get("reset");
  if (resetToken) {
    function clearTokenAndGoLogin() {
      window.history.replaceState({}, "", window.location.pathname);
    }
    return <ResetPasswordPage token={resetToken} onDone={clearTokenAndGoLogin} />;
  }

  if (!isAuthenticated) return <LoginPage />;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { user, isAdmin, isFabricante, isLojista, isVendedor, isAnalistaCRM, canManageUsers, allowedStoreIds, logout } = useAuth();
  const { stores } = useStores();
  const { reloadUsers } = useUsersContext();

  useEffect(() => {
    if ((isAdmin || isLojista) && user?.id) {
      reloadUsers(user.id);
    }
  }, [user?.id]);

  const [page,           setPage]           = useState<Page>("dashboard");
  const [dashboardTab,   setDashboardTab]   = useState<DashboardTab>("metricas");
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>(() =>
    isAdmin ? [] : allowedStoreIds
  );
  const [period, setPeriod] = useState<Period>("30d");

  function handleStoreChange(ids: string[]) {
    if (isAdmin) {
      setSelectedStores(ids);
    } else {
      setSelectedStores(ids.filter((id) => allowedStoreIds.includes(id)));
    }
  }

  function handlePageChange(p: Page) {
    setPage(p);
    setSidebarOpen(false);
  }

  const activeStoreIds = useMemo(
    () => stores.filter((s) => s.active !== false).map((s) => s.id),
    [stores]
  );

  const effectiveStoreIds = useMemo(
    () => selectedStores.length > 0 ? selectedStores : activeStoreIds,
    [selectedStores, activeStoreIds]
  );

  const filters = useMemo(
    () => ({
      storeIds:  effectiveStoreIds,
      period,
      ...(isVendedor && user?.crmUserId ? { crmUserId: user.crmUserId } : {}),
    }),
    [effectiveStoreIds, period, isVendedor, user?.crmUserId]
  );

  const { quotes, wonRevenueForPeriod, wonCountForPeriod } = useOrcamentos();

  const { kpis: rawKpis, funnel, trend, ranking, stageTimes, goalData } = useDashboard(filters);

  const orcamentosRevenue = wonRevenueForPeriod({ storeIds: effectiveStoreIds, period });
  const orcamentosAllCount = wonCountForPeriod({ storeIds: effectiveStoreIds, period });
  const orcamentosVendedorRevenue = isVendedor && user?.id
    ? wonRevenueForPeriod({ storeIds: effectiveStoreIds, period, vendedorId: user.id })
    : 0;
  const orcamentosVendedorCount = isVendedor && user?.id
    ? wonCountForPeriod({ storeIds: effectiveStoreIds, period, vendedorId: user.id })
    : 0;

  const kpis = useMemo(() => ({
    ...rawKpis,
    totalRevenue: rawKpis.totalRevenue + orcamentosRevenue,
    wonDeals: rawKpis.wonDeals + (isVendedor ? orcamentosVendedorCount : orcamentosAllCount),
  }), [rawKpis, orcamentosRevenue, orcamentosAllCount, orcamentosVendedorCount, isVendedor]);

  const storeMap = new Map(stores.map((s) => [s.id, s]));
  const filteredRanking = ranking
    .filter((r) => {
      const local = storeMap.get(r.store.id);
      return local ? local.active !== false : true;
    })
    .map((r) => {
      const local = storeMap.get(r.store.id);
      if (!local) return r;
      return { ...r, store: { ...r.store, name: local.name, city: local.city ?? r.store.city, state: local.state ?? r.store.state } };
    });

  const storeLabel = selectedStores.length === 0
    ? "Todas as lojas"
    : stores.filter((s) => selectedStores.includes(s.id)).map((s) => s.name).join(", ");

  function handleExportPDF() {
    exportDashboardPDF({ period: PERIOD_LABELS[period], storeLabel, kpis, funnel, ranking, trend, alerts: [] });
  }

  const pageTitle =
    page === "dashboard" ? "Dashboard" :
    page === "stores"    ? "Lojas"     : "Usuários";

  const roleLabel =
    isAdmin       ? "Administrador"   :
    isLojista     ? "Lojista"         :
    isVendedor    ? "Vendedor"        :
    isAnalistaCRM ? "Analista de CRM" :
                    "Fabricante";

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <>
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col border-r border-border bg-card/30 backdrop-blur-xl">
          <SidebarContents
            page={page}
            onPageChange={handlePageChange}
            isAdmin={isAdmin}
            isLojista={isLojista}
            isVendedor={isVendedor}
            canManageUsers={canManageUsers}
            user={user}
            roleLabel={roleLabel}
            userMenuOpen={userMenuOpen}
            setUserMenuOpen={setUserMenuOpen}
            logout={logout}
            allowedStoreIds={allowedStoreIds}
          />
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col border-r border-border bg-card md:hidden">
              <SidebarContents
                page={page}
                onPageChange={handlePageChange}
                isAdmin={isAdmin}
                isLojista={isLojista}
                isVendedor={isVendedor}
                canManageUsers={canManageUsers}
                user={user}
                roleLabel={roleLabel}
                userMenuOpen={userMenuOpen}
                setUserMenuOpen={setUserMenuOpen}
                logout={logout}
                allowedStoreIds={allowedStoreIds}
              />
            </aside>
          </>
        )}
      </>

      {/* ─── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex-shrink-0 h-14 flex items-center gap-3 px-4 sm:px-6 border-b border-border bg-card/30 backdrop-blur-sm">
          {/* Mobile hamburger */}
          <button
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
            {page === "dashboard" && !isVendedor && (
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                {PERIOD_LABELS[period]} · {selectedStores.length === 0 ? "Todas as lojas" : `${selectedStores.length} loja${selectedStores.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>

          {/* Controls — só no dashboard > métricas e não vendedor */}
          {page === "dashboard" && dashboardTab === "metricas" && !isVendedor && (
            <div className="flex items-center gap-2">
              <div className="hidden lg:block">
                <StoreFilter
                  selected={selectedStores}
                  onChange={handleStoreChange}
                  restrictToIds={isAdmin ? undefined : allowedStoreIds}
                />
              </div>
              <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-secondary/80 border border-border">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      period === p
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportPDF}
                title="Exportar PDF"
                className="hidden sm:flex h-8 items-center gap-1.5 px-3 text-xs font-medium rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">PDF</span>
              </button>
            </div>
          )}
        </header>

        {/* Mobile filters strip */}
        {page === "dashboard" && dashboardTab === "metricas" && !isVendedor && (
          <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-card/20 overflow-x-auto">
            <StoreFilter
              selected={selectedStores}
              onChange={handleStoreChange}
              restrictToIds={isAdmin ? undefined : allowedStoreIds}
            />
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-secondary/80 border border-border flex-shrink-0">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    period === p
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportPDF}
              className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border bg-secondary/50 text-muted-foreground"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        )}

        {/* Barra de meta do vendedor */}
        {isVendedor && goalData && <SalesGoalProgress goalData={goalData} />}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
            {page === "dashboard" ? (
              <div className="space-y-6">
                {/* Sub-abas */}
                <div className="flex items-center gap-0 border-b border-border">
                  <DashTab
                    active={dashboardTab === "metricas"}
                    onClick={() => setDashboardTab("metricas")}
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                    label="Métricas"
                  />
                  {!isAnalistaCRM && (
                    <DashTab
                      active={dashboardTab === "orcamentos"}
                      onClick={() => setDashboardTab("orcamentos")}
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Orçamentos"
                    />
                  )}
                </div>

                {dashboardTab === "metricas" ? (
                  isVendedor ? (
                    <VendedorDashboard kpis={kpis} orcamentosRevenue={orcamentosVendedorRevenue} quotes={quotes} vendedorId={user?.id} />
                  ) : (
                    <div className="space-y-5">
                      {!isAdmin && (
                        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-sm">
                          <Store className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">
                            Visualizando{" "}
                            <span className="text-foreground font-semibold">
                              {allowedStoreIds.length} loja{allowedStoreIds.length !== 1 ? "s" : ""}
                            </span>{" "}
                            sob sua responsabilidade
                          </span>
                        </div>
                      )}
                      <KPICards data={kpis} />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <FunnelChart data={funnel} />
                        <TrendChart  data={trend}  />
                      </div>
                      <StageTimeChart data={stageTimes} />
                      <StoreRanking   data={filteredRanking} />
                    </div>
                  )
                ) : (
                  <OrcamentosPage />
                )}
              </div>
            ) : page === "stores" ? (
              <StoresPage readOnly={!isAdmin} />
            ) : (
              <UsersPage />
            )}
          </div>
        </main>
      </div>

      {/* Overlay fecha menus */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}

/* ─── Sidebar contents ─────────────────────────────────────────────────────── */
function SidebarContents({
  page, onPageChange, isAdmin, isLojista, isVendedor, canManageUsers, user, roleLabel,
  userMenuOpen, setUserMenuOpen, logout, allowedStoreIds,
}: {
  page: Page;
  onPageChange: (p: Page) => void;
  isAdmin: boolean;
  isLojista: boolean;
  isVendedor: boolean;
  canManageUsers: boolean;
  user: { name: string; email: string; avatarInitials: string; role: string } | null;
  roleLabel: string;
  userMenuOpen: boolean;
  setUserMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  logout: () => void;
  allowedStoreIds: string[];
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-border flex-shrink-0">
        <div className="h-8 w-8 rounded-lg bg-[#1a1510] border border-[#f0d488]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={logoSvg} alt="Logo" className="h-6 w-6 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none text-foreground">iGUi Piscinas</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Inteligência Comercial</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 px-3 pt-2 pb-1.5">
          Navegação
        </p>
        <SidebarNavItem
          active={page === "dashboard"}
          onClick={() => onPageChange("dashboard")}
          icon={<BarChart3 className="h-4 w-4" />}
          label="Dashboard"
        />
        {!isVendedor && (
          <SidebarNavItem
            active={page === "stores"}
            onClick={() => onPageChange("stores")}
            icon={<Store className="h-4 w-4" />}
            label="Lojas"
          />
        )}
        {canManageUsers && (
          <SidebarNavItem
            active={page === "users"}
            onClick={() => onPageChange("users")}
            icon={<Users className="h-4 w-4" />}
            label="Usuários"
          />
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary/70 transition-colors text-left"
        >
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
            isAdmin ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]"
          }`}>
            {user?.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{roleLabel}</p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {userMenuOpen && (
          <div className="mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-xs font-semibold text-foreground">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {isAdmin && <ShieldCheck className="h-3 w-3 text-primary" />}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isAdmin                        ? "bg-primary/10 text-primary" :
                  isVendedor                     ? "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]" :
                  isLojista                      ? "bg-blue-500/10 text-blue-500" :
                  user?.role === "analista_crm"  ? "bg-purple-500/10 text-purple-500" :
                                                   "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]"
                }`}>
                  {roleLabel}
                </span>
              </div>
              {!isAdmin && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {allowedStoreIds.length} loja{allowedStoreIds.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => { setUserMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.06)] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Sidebar nav item ─────────────────────────────────────────────────────── */
function SidebarNavItem({ active, onClick, icon, label }: {
  active:  boolean;
  onClick: () => void;
  icon:    React.ReactNode;
  label:   string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
      }`}
    >
      <span className={active ? "text-primary" : ""}>{icon}</span>
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
    </button>
  );
}

/* ─── Dashboard sub-tab ────────────────────────────────────────────────────── */
function DashTab({ active, onClick, icon, label }: {
  active:  boolean;
  onClick: () => void;
  icon:    React.ReactNode;
  label:   string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {active && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-primary rounded-t-full" />}
    </button>
  );
}
