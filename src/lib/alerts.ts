import type { FunnelStageData, StoreRankingRow } from "./types";

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id:       string;
  severity: AlertSeverity;
  title:    string;
  message:  string;
  store?:   string;
  metric?:  string;
}

/** Thresholds configuráveis */
const THRESHOLDS = {
  totalConversionCritical: 8,   // % — abaixo disso: crítico
  totalConversionWarning:  12,  // % — abaixo disso: alerta
  stageConversionWarning:  50,  // % — conversão entre etapas abaixo disso: alerta
  avgCycleCritical:        60,  // dias — ciclo acima disso: crítico
  avgCycleWarning:         45,  // dias
  revenueDropWarning:      20,  // % queda vs. outra loja média
};

export function generateAlerts(
  funnel:  FunnelStageData[],
  ranking: StoreRankingRow[],
): Alert[] {
  const alerts: Alert[] = [];
  let seq = 0;
  const id = () => `alert-${++seq}`;

  // ── 1. Conversão total por loja ────────────────────────────────────────────
  for (const row of ranking) {
    if (row.conversion < THRESHOLDS.totalConversionCritical) {
      alerts.push({
        id: id(), severity: "critical",
        store: row.store.name,
        metric: "Conversão",
        title: `Conversão crítica — ${row.store.name.replace("iGUi ", "")}`,
        message: `Taxa de conversão de ${row.conversion}% está abaixo do mínimo aceitável (${THRESHOLDS.totalConversionCritical}%).`,
      });
    } else if (row.conversion < THRESHOLDS.totalConversionWarning) {
      alerts.push({
        id: id(), severity: "warning",
        store: row.store.name,
        metric: "Conversão",
        title: `Conversão baixa — ${row.store.name.replace("iGUi ", "")}`,
        message: `Taxa de conversão de ${row.conversion}% está abaixo do ideal (${THRESHOLDS.totalConversionWarning}%).`,
      });
    }
  }

  // ── 2. Gargalos no funil ──────────────────────────────────────────────────
  const bottlenecks = funnel.filter((s) => s.isBottleneck);
  for (const stage of bottlenecks) {
    alerts.push({
      id: id(), severity: "warning",
      metric: stage.label,
      title:  `Gargalo identificado: ${stage.label}`,
      message: `Esta etapa retém leads por mais tempo que a média e tem conversão de ${stage.conversionFromPrev}% para a próxima fase.`,
    });
  }

  // ── 3. Etapas com conversão muito baixa ───────────────────────────────────
  for (const stage of funnel) {
    if (
      stage.conversionFromPrev !== null &&
      stage.conversionFromPrev < THRESHOLDS.stageConversionWarning &&
      !stage.isLost && !stage.isBottleneck // já reportado acima se for gargalo
    ) {
      alerts.push({
        id: id(), severity: "warning",
        metric: stage.label,
        title:  `Baixa conversão em: ${stage.label}`,
        message: `Apenas ${stage.conversionFromPrev}% dos leads avançam para esta etapa. Verifique o processo.`,
      });
    }
  }

  // ── 4. Ciclo médio longo ──────────────────────────────────────────────────
  for (const row of ranking) {
    if (row.avgCycleDays > THRESHOLDS.avgCycleCritical) {
      alerts.push({
        id: id(), severity: "critical",
        store: row.store.name,
        metric: "Ciclo",
        title:  `Ciclo crítico — ${row.store.name.replace("iGUi ", "")}`,
        message: `Ciclo médio de ${row.avgCycleDays} dias está muito acima do aceitável (${THRESHOLDS.avgCycleCritical} dias).`,
      });
    } else if (row.avgCycleDays > THRESHOLDS.avgCycleWarning) {
      alerts.push({
        id: id(), severity: "warning",
        store: row.store.name,
        metric: "Ciclo",
        title:  `Ciclo longo — ${row.store.name.replace("iGUi ", "")}`,
        message: `Ciclo médio de ${row.avgCycleDays} dias acima do ideal (${THRESHOLDS.avgCycleWarning} dias).`,
      });
    }
  }

  // ── 5. Loja sem leads no período ──────────────────────────────────────────
  for (const row of ranking) {
    if (row.leads === 0) {
      alerts.push({
        id: id(), severity: "critical",
        store: row.store.name,
        title:  `Sem leads — ${row.store.name.replace("iGUi ", "")}`,
        message: `Nenhum lead registrado nesta loja no período selecionado.`,
      });
    }
  }

  // Ordena: crítico primeiro
  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}
