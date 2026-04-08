import { useState, useMemo } from "react";
import { BarChart3, Store, LogOut, ChevronDown, ShieldCheck, Users, Download, Menu, X } from "lucide-react";
import logoSvg from "@/assets/logo.svg";

import { KPICards }       from "@/components/dashboard/KPICards";
import { FunnelChart }    from "@/components/dashboard/FunnelChart";
import { TrendChart }     from "@/components/dashboard/TrendChart";
import { StoreRanking }   from "@/components/dashboard/StoreRanking";
import { StoreFilter }    from "@/components/dashboard/StoreFilter";
import { StageTimeChart } from "@/components/dashboard/StageTimeChart";
import { StoresPage }          from "@/components/stores/StoresPage";
import { UsersPage }           from "@/components/users/UsersPage";
import { LoginPage }           from "@/components/auth/LoginPage";
import { ResetPasswordPage }   from "@/components/auth/ResetPasswordPage";
import { useAuth }        from "@/contexts/AuthContext";
import { useDashboard }   from "@/hooks/useDashboard";
import { PERIOD_LABELS } from "@/lib/constants";
import { useStores } from "@/contexts/StoresContext";
import { exportDashboardPDF } from "@/lib/export-pdf";
import type { Period }    from "@/lib/types";

const PERIODS: Period[] = ["7d", "30d", "90d", "12m"];
type Page = "dashboard" | "stores" | "users";

export default function App() {
  const { isAuthenticated } = useAuth();

  // Detecta link de reset de senha na URL: ?reset=TOKEN
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
  const { user, isAdmin, allowedStoreIds, logout } = useAuth();
  const { stores } = useStores();

  const [page,          setPage]          = useState<Page>("dashboard");
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
  }

  const filters = useMemo(
    () => ({ storeIds: selectedStores, period }),
    [selectedStores, period]
  );

  const { kpis, funnel, trend, ranking, stageTimes } = useDashboard(filters);

  const storeLabel = selectedStores.length === 0
    ? "Todas as lojas"
    : stores.filter((s) => selectedStores.includes(s.id)).map((s) => s.name).join(", ");

  function handleExportPDF() {
    exportDashboardPDF({
      period: PERIOD_LABELS[period],
      storeLabel,
      kpis,
      funnel,
      ranking,
      trend,
      alerts: [],
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">

          {/* Logo */}
          <button onClick={() => handlePageChange("dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-lg bg-[#1a1510] border border-[#f0d488]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={logoSvg} alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight leading-none">Inteligência Comercial</h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">iGUi Piscinas</p>
            </div>
          </button>

          {/* Nav — desktop only */}
          <nav className="hidden md:flex items-center gap-1">
            <NavTab active={page === "dashboard"} onClick={() => handlePageChange("dashboard")}
              icon={<BarChart3 className="h-4 w-4" />} label="Dashboard"
            />
            <NavTab active={page === "stores"} onClick={() => handlePageChange("stores")}
              icon={<Store className="h-4 w-4" />} label="Lojas" />
            {isAdmin && (
              <NavTab active={page === "users"} onClick={() => handlePageChange("users")}
                icon={<Users className="h-4 w-4" />} label="Usuários" />
            )}
          </nav>

          {/* Direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Filtros desktop — apenas no dashboard */}
            {page === "dashboard" && (
              <>
                <div className="hidden md:block">
                  <StoreFilter
                    selected={selectedStores}
                    onChange={handleStoreChange}
                    restrictToIds={isAdmin ? undefined : allowedStoreIds}
                  />
                </div>
                <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
                  {PERIODS.map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}>
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleExportPDF}
                  title="Exportar relatório PDF"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Exportar PDF</span>
                </button>
              </>
            )}

            {/* Menu do usuário */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  isAdmin ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]"
                }`}>
                  {user?.avatarInitials}
                </div>
                <span className="text-xs font-medium text-foreground hidden sm:block max-w-[100px] truncate">
                  {user?.name}
                </span>
                {isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-primary hidden sm:block" />}
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isAdmin ? "bg-primary/15 text-primary" : "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                    }`}>
                      {isAdmin ? <><ShieldCheck className="h-2.5 w-2.5" /> Administrador</> : "Fabricante"}
                    </span>
                  </div>
                  {!isAdmin && (
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Suas lojas</p>
                      <p className="text-xs text-foreground">{allowedStoreIds.length} loja{allowedStoreIds.length !== 1 ? "s" : ""} na sua jurisdição</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.06)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              )}
            </div>

            {/* Botão menu mobile */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden h-9 w-9 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Barra de filtros mobile — apenas no dashboard */}
        {page === "dashboard" && (
          <div className="md:hidden border-t border-border flex flex-col">
            {/* Linha 1: StoreFilter — sem overflow para o dropdown funcionar */}
            <div className="px-4 pt-2 pb-1">
              <StoreFilter
                selected={selectedStores}
                onChange={handleStoreChange}
                restrictToIds={isAdmin ? undefined : allowedStoreIds}
              />
            </div>
            {/* Linha 2: período + PDF — pode ter scroll horizontal */}
            <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border flex-shrink-0">
                {PERIODS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportPDF}
                title="Exportar PDF"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
            </div>
          </div>
        )}

        {/* Menu mobile expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="flex flex-col p-2 gap-1">
              <MobileNavItem active={page === "dashboard"} onClick={() => handlePageChange("dashboard")}
                icon={<BarChart3 className="h-4 w-4" />} label="Dashboard"
              />
              <MobileNavItem active={page === "stores"} onClick={() => handlePageChange("stores")}
                icon={<Store className="h-4 w-4" />} label="Lojas"
              />
              {isAdmin && (
                <MobileNavItem active={page === "users"} onClick={() => handlePageChange("users")}
                  icon={<Users className="h-4 w-4" />} label="Usuários"
                />
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Conteúdo */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {page === "dashboard" ? (
          <div className="space-y-4 sm:space-y-6">
            {!isAdmin && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)] text-sm">
                <Store className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  Visualizando dados de{" "}
                  <span className="text-foreground font-medium">{allowedStoreIds.length} loja{allowedStoreIds.length !== 1 ? "s" : ""}</span>{" "}
                  sob sua responsabilidade.
                </span>
              </div>
            )}

            <KPICards data={kpis} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <FunnelChart data={funnel} />
              <TrendChart  data={trend}  />
            </div>
            <StageTimeChart data={stageTimes} />
            <StoreRanking   data={ranking}    />
          </div>
        ) : page === "stores" ? (
          <StoresPage readOnly={!isAdmin} />
        ) : (
          <UsersPage />
        )}
      </main>

      {/* Overlay para fechar menus */}
      {(userMenuOpen || mobileMenuOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }} />
      )}
    </div>
  );
}

function NavTab({ active, onClick, icon, label, badge }: {
  active:  boolean;
  onClick: () => void;
  icon:    React.ReactNode;
  label:   string;
  badge?:  number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {icon}{label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--danger))] text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label, badge }: {
  active:  boolean;
  onClick: () => void;
  icon:    React.ReactNode;
  label:   string;
  badge?:  number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors w-full text-left ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {icon}{label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto h-5 w-5 rounded-full bg-[hsl(var(--danger))] text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
