import { forwardRef } from "react";
import type { QuoteFormData, PoolModel, PoolSize } from "@/lib/pool-data";
import { formatCurrency, loadPoolModels, loadPoolSizes } from "@/lib/pool-data";

const BLUE  = "#0071BC";
const NAVY  = "#1B3A6B";
const GOLD  = "#F5A623";
const LIGHT = "#E8F4FD";
const PAGE  = { width: 794, minHeight: 1123, padding: 40 } as const;

const items = [
  { name: "Piscina PRFV + Cerâmica Atlas",        qty: "01 un" },
  { name: "Filtro G7 Comfort",                     qty: "01 un" },
  { name: "Clorador iGUi Automático",              qty: "01 un" },
  { name: "Quadro de Comando QC-MAX",              qty: "01 un" },
  { name: "MotoBomba 3/4 CV",                      qty: "01 un" },
  { name: "iGUiLux Color RGB 18W",                 qty: "02 un" },
  { name: "Corrimão em Titânio",                   qty: "01 un" },
  { name: "Papaterra Inox",                        qty: "01 un" },
  { name: "Aquanível",                             qty: "01 un" },
  { name: "Sistema MAX — limpeza fácil",           qty: "01 un" },
  { name: "Kit de Aspiração",                      qty: "01 un" },
  { name: "Skimmer Filtrante + Pratic",            qty: "01 un" },
  { name: "Projeto 3D da piscina",                 qty: "01 un" },
  { name: "Manual de Garantia e Manutenção",       qty: "01 un" },
];

const brindes = [
  "Algicida de Manutenção",
  "Cloro Estabilizado",
  "Limpa Borda",
];

const garantias = [
  { years: "5 anos", label: "Piscina Cerâmica", sub: "Revestimento cerâmico Atlas" },
  { years: "1 ano",  label: "Parte Hidráulica", sub: "Equipamentos e conexões" },
  { years: "1 ano",  label: "Instalação Elétrica", sub: "Quadro e fiação" },
];

const observacoes = [
  "A instalação deverá ser realizada por profissional habilitado iGUi.",
  "A escavação e preparação do terreno são de responsabilidade do cliente.",
  "O prazo de entrega é de até 3 dias úteis após confirmação do pagamento.",
  "O projeto inclui exclusivamente os itens listados neste orçamento.",
  "Qualquer item adicional solicitado será orçado separadamente.",
  "A piscina será entregue montada e pronta para uso, incluindo teste hidráulico.",
];

const proxPassos = [
  { num: "01", title: "Confirmar Proposta", desc: "Retorne o aceite por escrito ou via WhatsApp." },
  { num: "02", title: "Assinar Contrato",   desc: "Contrato enviado digitalmente para assinatura." },
  { num: "03", title: "Realizar Pagamento", desc: "Boleto emitido após assinatura do contrato." },
  { num: "04", title: "Agendar Instalação", desc: "Nossa equipe entrará em contato para agendar." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBadge({ num, label }: { num: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{
        background: BLUE, color: "#fff", fontWeight: 700, fontSize: 11,
        padding: "3px 10px", borderRadius: 4,
      }}>
        {num}
      </div>
      <span style={{ fontWeight: 700, fontSize: 13, color: NAVY, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </span>
    </div>
  );
}

function PageHeader({ clientCity }: { clientCity: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          background: BLUE, color: "#fff", fontWeight: 900, fontSize: 22,
          padding: "6px 14px", borderRadius: 6, letterSpacing: 1,
        }}>
          iGUi
        </div>
        <div style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>Piscinas</div>
          <div style={{ fontSize: 11, color: "#666" }}>A sua piscina!</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "#888" }}>Orçamento</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{clientCity}</div>
      </div>
    </div>
  );
}

function PageFooter({ sellerName }: { sellerName: string }) {
  return (
    <div style={{
      marginTop: "auto", paddingTop: 12,
      borderTop: `2px solid ${BLUE}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: 10, color: "#666" }}>
        Consultor: <strong style={{ color: NAVY }}>{sellerName}</strong>
      </span>
      <div style={{ background: BLUE, color: "#fff", fontWeight: 700, fontSize: 10, padding: "2px 10px", borderRadius: 3 }}>
        iGUi Piscinas
      </div>
    </div>
  );
}

function ItemsTableRows({ rows }: { rows: typeof items }) {
  return (
    <>
      {rows.map((item, i) => (
        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : LIGHT }}>
          <td style={{ padding: "7px 10px", fontWeight: 700, fontSize: 11, color: NAVY, width: 32, textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>
            {String(i + 1).padStart(2, "0")}
          </td>
          <td style={{ padding: "7px 10px", fontSize: 12, color: "#333", borderBottom: "1px solid #e0e0e0" }}>
            {item.name}
          </td>
          <td style={{ padding: "7px 10px", fontSize: 11, color: "#555", textAlign: "center", width: 60, borderBottom: "1px solid #e0e0e0" }}>
            {item.qty}
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function Page1({ data, model, size }: { data: QuoteFormData; model: PoolModel; size: PoolSize }) {
  const p = PAGE.padding;
  return (
    <div
      data-pdf-page="true"
      style={{
        width: PAGE.width, minHeight: PAGE.minHeight,
        padding: p, boxSizing: "border-box",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        background: "#fff", display: "flex", flexDirection: "column",
      }}
    >
      {/* Top accent */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${BLUE}, ${NAVY})`, margin: `-${p}px -${p}px ${p}px`, width: `calc(100% + ${p * 2}px)` }} />

      <PageHeader clientCity={data.clientCity} />

      {/* Client data */}
      <div style={{ background: LIGHT, borderRadius: 8, padding: 16, marginBottom: 18, border: `1px solid #cce4f7` }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: BLUE, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Dados do Cliente
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
          <DataRow label="Nome" value={data.clientName} />
          <DataRow label="Cidade" value={data.clientCity} />
          {data.clientAddress && <DataRow label="Endereço" value={data.clientAddress} />}
          {data.clientPhone   && <DataRow label="WhatsApp" value={data.clientPhone} />}
          {data.clientEmail   && <DataRow label="E-mail"   value={data.clientEmail} />}
          <DataRow label="Data" value={new Date().toLocaleDateString("pt-BR")} />
        </div>
      </div>

      {/* Section 01 — Pool */}
      <div style={{ marginBottom: 20 }}>
        <SectionBadge num="01" label="Modelo de Piscina" />
        <div style={{
          border: `2px solid ${BLUE}`, borderRadius: 10, overflow: "hidden",
        }}>
          <div style={{ background: BLUE, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{`Piscina ${model.name}`}</span>
            <span style={{ fontSize: 11, color: "#cce4f7" }}>{model.line}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 16px", gap: 12 }}>
            <PoolSpec label="Dimensões" value={size.dimensions} />
            {data.ceramicColor && <PoolSpec label="Cor Cerâmica" value={data.ceramicColor} />}
            <PoolSpec label="Filtro" value="G7 Comfort" />
            <PoolSpec label="Entrega" value="Até 3 dias" />
            <PoolSpec label="Garantia" value="5 anos" />
          </div>
        </div>
      </div>

      {/* Section 02 — items (first 7) */}
      <div style={{ flex: 1 }}>
        <SectionBadge num="02" label="Itens Inclusos" />
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid #cce4f7`, borderRadius: 8, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: NAVY }}>
              <th style={{ padding: "8px 10px", color: "#fff", fontSize: 11, width: 32 }}>#</th>
              <th style={{ padding: "8px 10px", color: "#fff", fontSize: 11, textAlign: "left" }}>Item</th>
              <th style={{ padding: "8px 10px", color: "#fff", fontSize: 11, width: 60 }}>Qtd</th>
            </tr>
          </thead>
          <tbody>
            <ItemsTableRows rows={items.slice(0, 7)} />
          </tbody>
        </table>
      </div>

      <PageFooter sellerName={data.sellerName} />
    </div>
  );
}

function Page2({ data }: { data: QuoteFormData }) {
  const p = PAGE.padding;
  return (
    <div
      data-pdf-page="true"
      style={{
        width: PAGE.width, minHeight: PAGE.minHeight,
        padding: p, boxSizing: "border-box",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        background: "#fff", display: "flex", flexDirection: "column", gap: 18,
      }}
    >
      <div style={{ height: 6, background: `linear-gradient(90deg, ${BLUE}, ${NAVY})`, margin: `-${p}px -${p}px 0`, width: `calc(100% + ${p * 2}px)` }} />

      {/* Items cont. (7-14) */}
      <div>
        <SectionBadge num="02" label="Itens Inclusos (continuação)" />
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid #cce4f7` }}>
          <thead>
            <tr style={{ background: NAVY }}>
              <th style={{ padding: "8px 10px", color: "#fff", fontSize: 11, width: 32 }}>#</th>
              <th style={{ padding: "8px 10px", color: "#fff", fontSize: 11, textAlign: "left" }}>Item</th>
              <th style={{ padding: "8px 10px", color: "#fff", fontSize: 11, width: 60 }}>Qtd</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(7).map((item, i) => (
              <tr key={i} style={{ background: (i + 7) % 2 === 0 ? "#fff" : LIGHT }}>
                <td style={{ padding: "7px 10px", fontWeight: 700, fontSize: 11, color: NAVY, textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>
                  {String(i + 8).padStart(2, "0")}
                </td>
                <td style={{ padding: "7px 10px", fontSize: 12, color: "#333", borderBottom: "1px solid #e0e0e0" }}>{item.name}</td>
                <td style={{ padding: "7px 10px", fontSize: 11, color: "#555", textAlign: "center", borderBottom: "1px solid #e0e0e0" }}>{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Exclusividade note */}
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#fffbf0", border: `1px solid ${GOLD}`, borderRadius: 6 }}>
          <span style={{ fontSize: 11, color: "#7a5a00", fontWeight: 600 }}>
            Exclusividade iGUi — </span>
          <span style={{ fontSize: 11, color: "#7a5a00" }}>
            Todos os equipamentos são originais e homologados pela iGUi Piscinas.
          </span>
        </div>
      </div>

      {/* Brindes */}
      <div style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}`, borderRadius: 8, padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: "#7a5a00", marginBottom: 8 }}>
          Brindes inclusos
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {brindes.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ color: GOLD, fontWeight: 700 }}>✦</span>
              <span style={{ color: "#555" }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 03 — Investment */}
      <div>
        <SectionBadge num="03" label="Investimento" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ border: `2px solid ${BLUE}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Investimento Total</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>{formatCurrency(data.proposalValue)}</div>
          </div>
          <div style={{ background: LIGHT, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <PayRow label="Pagamento" value="Boleto bancário" />
            <PayRow label="Validade"  value="7 dias corridos" />
            <PayRow label="Entrega"   value="Até 3 dias úteis" />
          </div>
        </div>
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0f9f0", border: "1px solid #a4d4a4", borderRadius: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "#2d6a2d", marginBottom: 4 }}>Por que fechar agora?</div>
          <div style={{ fontSize: 11, color: "#3a7a3a", lineHeight: 1.5 }}>
            Condição especial válida por 7 dias. Garanta o preço e a disponibilidade da equipe de instalação.
          </div>
        </div>
      </div>

      {/* Section 04 — Guarantees */}
      <div>
        <SectionBadge num="04" label="Garantias" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {garantias.map((g, i) => (
            <div key={i} style={{ border: `1px solid #cce4f7`, borderRadius: 8, overflow: "hidden", textAlign: "center" }}>
              <div style={{ background: NAVY, padding: "8px 4px" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: GOLD }}>{g.years}</div>
              </div>
              <div style={{ padding: "10px 8px" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: NAVY }}>{g.label}</div>
                <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>{g.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PageFooter sellerName={data.sellerName} />
    </div>
  );
}

function Page3({ data }: { data: QuoteFormData }) {
  const p = PAGE.padding;
  return (
    <div
      data-pdf-page="true"
      style={{
        width: PAGE.width, minHeight: PAGE.minHeight,
        padding: p, boxSizing: "border-box",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        background: "#fff", display: "flex", flexDirection: "column", gap: 20,
      }}
    >
      <div style={{ height: 6, background: `linear-gradient(90deg, ${BLUE}, ${NAVY})`, margin: `-${p}px -${p}px 0`, width: `calc(100% + ${p * 2}px)` }} />

      {/* Section 05 — Observações */}
      <div>
        <SectionBadge num="05" label="Observações Técnicas" />
        <div style={{ border: `1px solid #cce4f7`, borderRadius: 8, padding: 16, background: LIGHT }}>
          {observacoes.map((obs, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < observacoes.length - 1 ? 8 : 0 }}>
              <span style={{ color: BLUE, fontWeight: 700, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>{obs}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Próximos Passos */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: NAVY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
          Próximos Passos
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {proxPassos.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: 14, border: `1px solid #cce4f7`, borderRadius: 8, background: "#fff",
            }}>
              <div style={{
                background: BLUE, color: "#fff", fontWeight: 700, fontSize: 13,
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: NAVY }}>{step.title}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 3, lineHeight: 1.4 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{
        borderTop: `2px solid ${BLUE}`, paddingTop: 16,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{data.sellerName}</div>
          <div style={{ fontSize: 11, color: "#888" }}>Consultor iGUi Piscinas</div>
          {data.clientCity && (
            <div style={{ fontSize: 11, color: "#888" }}>{data.clientCity}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: BLUE, color: "#fff", fontWeight: 700, fontSize: 14, padding: "6px 16px", borderRadius: 6 }}>
            iGUi
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>A sua piscina!</div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>{label}: </span>
      <span style={{ fontSize: 12, color: "#222", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function PoolSpec({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#aaa" }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{value}</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface IguiQuoteTemplateProps {
  data: QuoteFormData;
  storeId?: string;
}

export const IguiQuoteTemplate = forwardRef<HTMLDivElement, IguiQuoteTemplateProps>(
  ({ data, storeId }, ref) => {
    const allModels = loadPoolModels(storeId);
    const allSizes  = loadPoolSizes(storeId);
    const model = allModels.find((m) => m.id === data.poolModelId);
    const size  = allSizes.find((s) => s.id === data.poolSizeId);
    if (!model || !size) return null;
    return (
      <div ref={ref} style={{ background: "#fff" }}>
        <Page1 data={data} model={model} size={size} />
        <Page2 data={data} />
        <Page3 data={data} />
      </div>
    );
  }
);
