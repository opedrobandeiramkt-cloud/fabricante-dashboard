import type { KPIData, FunnelStageData, StoreRankingRow, TrendPoint } from "./types";
import type { Alert } from "./alerts";

function formatBRL(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  return `R$ ${(v / 1_000).toFixed(0)}K`;
}

function deltaStr(v: number) {
  return `${v >= 0 ? "+" : ""}${v}%`;
}

function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function exportDashboardPDF(params: {
  period:    string;
  storeLabel: string;
  kpis:      KPIData;
  funnel:    FunnelStageData[];
  ranking:   StoreRankingRow[];
  trend:     TrendPoint[];
  alerts:    Alert[];
}) {
  const { period, storeLabel, kpis, funnel, ranking, alerts } = params;

  const now = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const funnelRows = funnel
    .filter((s) => !s.isLost)
    .map((s) => `
      <tr>
        <td>${s.label}${s.isBottleneck ? ' <span class="badge warn">Gargalo</span>' : ""}${s.isWon ? ' <span class="badge success">Ganho</span>' : ""}</td>
        <td class="num">${s.count.toLocaleString("pt-BR")}</td>
        <td class="num">${s.conversionFromPrev !== null ? `${s.conversionFromPrev}%` : "—"}</td>
      </tr>
    `).join("");

  const rankingRows = ranking.map((r, i) => `
    <tr>
      <td>${i + 1}. ${r.store.name.replace("iGUi ", "")}</td>
      <td class="num">${r.leads.toLocaleString("pt-BR")}</td>
      <td class="num">${r.conversion}%</td>
      <td class="num">${r.wonDeals}</td>
      <td class="num">${formatBRL(r.revenue)}</td>
      <td class="num">${formatBRL(r.avgTicket)}</td>
      <td class="num">${r.avgCycleDays}d</td>
      <td class="num">${formatResponseTime(r.avgFirstResponseMinutes)}</td>
    </tr>
  `).join("");

  const alertsHtml = alerts.length === 0
    ? "<p style='color:#888'>Nenhum alerta ativo no período.</p>"
    : alerts.map((a) => `
        <div class="alert ${a.severity}">
          <strong>${a.title}</strong><br/>
          <span>${a.message}</span>
        </div>
      `).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório Inteligência Comercial — iGUi</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; font-size: 12px; background: #fff; }
  .page { max-width: 900px; margin: 0 auto; padding: 32px; }
  h1 { font-size: 22px; font-weight: 700; color: #111; }
  h2 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; }
  .meta { color: #666; font-size: 11px; margin-top: 4px; margin-bottom: 28px; }
  .section { margin-bottom: 32px; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .kpi { background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; }
  .kpi .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi .value { font-size: 22px; font-weight: 700; color: #111; margin: 4px 0; }
  .kpi .delta { font-size: 11px; color: #666; }
  .kpi .delta.pos { color: #22863a; }
  .kpi .delta.neg { color: #cb2431; }
  .kpi.highlight { border-color: #2da44e; background: #f6fff8; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border-bottom: 2px solid #e5e5e5; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #333; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .badge { display: inline-block; font-size: 9px; padding: 1px 6px; border-radius: 99px; font-weight: 600; margin-left: 4px; }
  .badge.warn { background: #fff3cd; color: #856404; }
  .badge.success { background: #d1fae5; color: #065f46; }
  .alert { padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; font-size: 11px; }
  .alert.critical { background: #fef2f2; border-left: 3px solid #ef4444; }
  .alert.warning  { background: #fffbeb; border-left: 3px solid #f59e0b; }
  .alert.info     { background: #eff6ff; border-left: 3px solid #3b82f6; }
  .alert strong { display: block; margin-bottom: 2px; color: #111; }
  .alert span { color: #555; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; }
  }
</style>
</head>
<body>
<div class="page">
  <h1>Inteligência Comercial — iGUi Piscinas</h1>
  <p class="meta">Período: ${period} &nbsp;·&nbsp; Lojas: ${storeLabel} &nbsp;·&nbsp; Gerado em: ${now}</p>

  <!-- KPIs -->
  <div class="section">
    <h2>Indicadores Principais</h2>
    <div class="kpis">
      <div class="kpi">
        <div class="label">Total de Leads</div>
        <div class="value">${kpis.totalLeads.toLocaleString("pt-BR")}</div>
        <div class="delta ${kpis.totalLeadsDelta >= 0 ? "pos" : "neg"}">${deltaStr(kpis.totalLeadsDelta)} vs. período anterior</div>
      </div>
      <div class="kpi">
        <div class="label">Conversão Total</div>
        <div class="value">${kpis.totalConversion}%</div>
        <div class="delta ${kpis.totalConversionDelta >= 0 ? "pos" : "neg"}">${kpis.totalConversionDelta >= 0 ? "+" : ""}${kpis.totalConversionDelta} p.p.</div>
      </div>
      <div class="kpi">
        <div class="label">Vendas Fechadas</div>
        <div class="value">${kpis.wonDeals.toLocaleString("pt-BR")}</div>
        <div class="delta ${kpis.wonDealsDelta >= 0 ? "pos" : "neg"}">${deltaStr(kpis.wonDealsDelta)} vs. período anterior</div>
      </div>
      <div class="kpi highlight">
        <div class="label">Faturamento Total</div>
        <div class="value">${formatBRL(kpis.totalRevenue)}</div>
        <div class="delta ${kpis.totalRevenueDelta >= 0 ? "pos" : "neg"}">${deltaStr(kpis.totalRevenueDelta)} vs. período anterior</div>
      </div>
      <div class="kpi">
        <div class="label">Ticket Médio</div>
        <div class="value">${formatBRL(kpis.avgTicket)}</div>
        <div class="delta ${kpis.avgTicketDelta >= 0 ? "pos" : "neg"}">${deltaStr(kpis.avgTicketDelta)} vs. período anterior</div>
      </div>
      <div class="kpi">
        <div class="label">Ciclo Médio</div>
        <div class="value">${kpis.avgCycleDays} dias</div>
        <div class="delta">meta: até 45 dias</div>
      </div>
      <div class="kpi">
        <div class="label">Tempo de 1ª Resposta</div>
        <div class="value">${formatResponseTime(kpis.avgFirstResponseMinutes)}</div>
        <div class="delta ${(-kpis.avgFirstResponseDelta) >= 0 ? "pos" : "neg"}">${deltaStr(-kpis.avgFirstResponseDelta)} vs. período anterior</div>
      </div>
    </div>
  </div>

  <!-- Funil -->
  <div class="section">
    <h2>Funil de Conversão</h2>
    <table>
      <thead><tr><th>Etapa</th><th class="num">Leads</th><th class="num">Conv. da etapa anterior</th></tr></thead>
      <tbody>${funnelRows}</tbody>
    </table>
  </div>

  <!-- Ranking (oculto quando apenas uma loja selecionada) -->
  ${ranking.length > 1 ? `
  <div class="section">
    <h2>Ranking de Lojas</h2>
    <table>
      <thead>
        <tr>
          <th>Loja</th>
          <th class="num">Leads</th>
          <th class="num">Conversão</th>
          <th class="num">Vendas</th>
          <th class="num">Faturamento</th>
          <th class="num">Ticket Médio</th>
          <th class="num">Ciclo</th>
          <th class="num">1ª Resposta</th>
        </tr>
      </thead>
      <tbody>${rankingRows}</tbody>
    </table>
  </div>
  ` : ""}

  <!-- Alertas -->
  <div class="section">
    <h2>Alertas Ativos</h2>
    ${alertsHtml}
  </div>

  <div class="footer">
    <span>iGUi Piscinas — Dashboard de Inteligência Comercial</span>
    <span>${now}</span>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const blob   = new Blob([html], { type: "text/html;charset=utf-8" });
  const url    = URL.createObjectURL(blob);
  const win    = window.open(url, "_blank");
  if (win) win.focus();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
