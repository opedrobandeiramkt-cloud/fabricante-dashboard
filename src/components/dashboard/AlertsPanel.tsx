import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, X, BellRing } from "lucide-react";
import type { Alert, AlertSeverity } from "@/lib/alerts";

interface AlertsPanelProps {
  alerts: Alert[];
}

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  badge: string;
}> = {
  critical: {
    icon:   <AlertCircle className="h-4 w-4" />,
    bg:     "bg-[hsl(var(--danger)/0.06)]",
    border: "border-[hsl(var(--danger)/0.25)]",
    text:   "text-[hsl(var(--danger))]",
    badge:  "bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]",
  },
  warning: {
    icon:   <AlertTriangle className="h-4 w-4" />,
    bg:     "bg-[hsl(var(--warning)/0.06)]",
    border: "border-[hsl(var(--warning)/0.25)]",
    text:   "text-[hsl(var(--warning))]",
    badge:  "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
  },
  info: {
    icon:   <Info className="h-4 w-4" />,
    bg:     "bg-[hsl(var(--primary)/0.05)]",
    border: "border-[hsl(var(--primary)/0.2)]",
    text:   "text-primary",
    badge:  "bg-[hsl(var(--primary)/0.12)] text-primary",
  },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded,  setExpanded]  = useState(true);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  const critical = visible.filter((a) => a.severity === "critical").length;
  const warnings = visible.filter((a) => a.severity === "warning").length;

  if (visible.length === 0) return null;

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <BellRing className="h-5 w-5 text-muted-foreground" />
            {critical > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[hsl(var(--danger))] border-2 border-card" />
            )}
          </div>
          <span className="text-sm font-semibold text-foreground">
            Alertas do Dashboard
          </span>
          <div className="flex items-center gap-2">
            {critical > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]">
                {critical} crítico{critical !== 1 ? "s" : ""}
              </span>
            )}
            {warnings > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]">
                {warnings} alerta{warnings !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp   className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {/* Lista */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {visible.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 px-5 py-3.5 ${cfg.bg}`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${cfg.text}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${cfg.text}`}>{alert.title}</p>
                    {alert.metric && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.badge}`}>
                        {alert.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
                <button
                  onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                  className="flex-shrink-0 h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mt-0.5"
                  title="Dispensar alerta"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
