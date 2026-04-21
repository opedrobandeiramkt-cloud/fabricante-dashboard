import { forwardRef } from "react";
import {
  type QuoteFormData,
  loadPoolModels,
  loadPoolSizes,
  heatingOptions,
  casasDeMaquina,
  standardItems,
  formatCurrency,
} from "@/lib/pool-data";

interface QuoteTemplateProps {
  data: QuoteFormData;
}

const PINK = "#E60A80";
const BLUE = "#6FCAF1";
const GREEN = "#A4CFAE";
const INK = "#0f172a";
const INK_MUTED = "#64748b";
const SLATE_BG = "#f8fafc";
const SLATE_BORDER = "#e2e8f0";

// Each page is captured individually via html2canvas + jsPDF (no CSS page-break tricks).
// fontWeight stays at 700 — fontWeight 800 causes html2canvas to collapse spaces.
const PAGE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "14mm 16mm",
  background: "#fff",
  color: INK,
  fontFamily: "Nunito, Arial, sans-serif",
  fontSize: "11px",
  lineHeight: 1.5,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxSizing: "border-box",
};

export const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  ({ data }, ref) => {
    const allModels = loadPoolModels();
    const allSizes = loadPoolSizes();
    const model = allModels.find((m) => m.id === data.poolModelId);
    const size = allSizes.find((s) => s.id === data.poolSizeId);
    const heating = data.heatingId ? heatingOptions.find((h) => h.id === data.heatingId) : null;
    const casaMaquina = casasDeMaquina.find((c) => c.id === data.casaDeMaquinaId);

    if (!model || !size) return null;

    const today = new Date();
    const dateStr = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const quoteNumber = `SP-${today.getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
    const validityDate = new Date(today);
    validityDate.setDate(validityDate.getDate() + 7);

    const allItems = [...standardItems];
    if (heating) allItems.push({ name: heating.name, qty: 1, description: heating.description });
    if (data.includeClorador) allItems.push({ name: "Clorador Automático", qty: 1 });

    const dimParts = size.dimensions.split("x").map((s) => s.trim());
    const [comp, larg, prof] = [dimParts[0] ?? "—", dimParts[1] ?? "—", dimParts[2] ?? "—"];

    const half = Math.ceil(allItems.length / 2);
    const col1 = allItems.slice(0, half);
    const col2 = allItems.slice(half);

    return (
      <div ref={ref} style={{ background: "#fff" }}>

        {/* ══════ PAGE 1 — CAPA ══════ */}
        <div data-pdf-page="true" style={PAGE}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Capa" />

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "28px" }}>
            <div>
              <SectionLabel color={BLUE}>Preparado Para</SectionLabel>
              <div style={{ paddingLeft: "10px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: INK }}>{data.clientName}</div>
                <div style={{ fontSize: "10px", color: INK_MUTED, marginTop: "4px", lineHeight: 1.6 }}>
                  {data.clientAddress && <>{data.clientAddress}<br /></>}
                  {data.clientCity}
                  {data.clientEmail && <><br />{data.clientEmail}</>}
                </div>
              </div>
            </div>
            <div>
              <SectionLabel color={PINK}>Consultor Responsável</SectionLabel>
              <div style={{ paddingLeft: "10px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: INK }}>{data.sellerName}</div>
                <div style={{ fontSize: "10px", color: INK_MUTED, marginTop: "4px", lineHeight: 1.6 }}>
                  Splash Piscinas iGUi<br />Revendedora Autorizada
                </div>
              </div>
            </div>
          </section>

          <section style={{ background: SLATE_BG, border: `1px solid ${SLATE_BORDER}`, padding: "22px 24px", marginTop: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
                  Modelo Selecionado
                </div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: INK, lineHeight: 1.1 }}>{`Piscina ${model.name}`}</div>
                <div style={{ fontSize: "10px", color: INK_MUTED, marginTop: "4px" }}>
                  {`Linha ${model.line} · Estrutura em fibra de vidro PRFV reforçado`}
                </div>
              </div>
              <div style={{ background: PINK, color: "#fff", padding: "4px 10px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                {`Linha ${model.line}`}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", borderTop: `1px solid ${SLATE_BORDER}`, paddingTop: "16px" }}>
              <SpecCell label="Comprimento" value={comp} unit="m" />
              <SpecCell label="Largura" value={larg} unit="m" />
              <SpecCell label="Profundidade" value={prof} unit="m" />
            </div>
          </section>

          <section style={{ marginTop: "20px", background: `${PINK}0d`, border: `1px solid ${PINK}40`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: PINK, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Investimento Total do Projeto
              </div>
              <div style={{ fontSize: "9px", color: INK_MUTED, marginTop: "6px", maxWidth: "40ch" }}>
                Inclui casco, equipamentos de série, frete e instalação completa. Orçamento válido por 7 dias corridos.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: PINK, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {formatCurrency(data.proposalValue)}
              </div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: INK, marginTop: "6px" }}>
                Condições de pagamento facilitadas
              </div>
            </div>
          </section>

          <div style={{ flex: 1 }} />
          <Footer pageNum={1} pageTotal={4} />
        </div>

        {/* ══════ PAGE 2 — ESPECIFICAÇÕES ══════ */}
        <div data-pdf-page="true" style={PAGE}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Especificações" />

          <h2 style={{ fontSize: "20px", fontWeight: 700, color: INK, marginTop: "24px", marginBottom: "6px" }}>
            Detalhes técnicos da piscina
          </h2>
          <p style={{ fontSize: "10px", color: INK_MUTED, marginBottom: "20px" }}>
            Especificações completas do modelo selecionado e equipamentos auxiliares.
          </p>

          <div style={{ border: `1px solid ${SLATE_BORDER}` }}>
            <DetailRow label="Modelo" value={model.name} />
            <DetailRow label="Linha" value={model.line} />
            <DetailRow label="Dimensões (C × L × P)" value={`${size.dimensions} m`} />
            <DetailRow label="Material" value="Fibra de vidro PRFV reforçado" />
            <DetailRow label="Acabamento interno" value={size.semiPastilha ? `Semi-pastilhada${size.pastilhaSize ? ` (${size.pastilhaSize})` : ""}` : "Gel-coat brilhante"} />
            <DetailRow label="Casa de máquinas" value={casaMaquina?.name ?? "—"} />
            <DetailRow label="Aquecimento" value={heating?.name ?? "Não incluso"} />
            <DetailRow label="Clorador automático" value={data.includeClorador ? "Incluso" : "Não incluso"} last />
          </div>

          {casaMaquina && (
            <div style={{ marginTop: "20px", background: `${BLUE}14`, borderLeft: `3px solid ${BLUE}`, padding: "14px 18px" }}>
              <SectionLabel color={BLUE}>{casaMaquina.name}</SectionLabel>
              <p style={{ fontSize: "10px", color: INK, lineHeight: 1.7, marginTop: "4px" }}>{casaMaquina.description}</p>
            </div>
          )}
          {heating && (
            <div style={{ marginTop: "12px", background: `${GREEN}26`, borderLeft: `3px solid ${GREEN}`, padding: "14px 18px" }}>
              <SectionLabel color="#5b9b69">{heating.name}</SectionLabel>
              <p style={{ fontSize: "10px", color: INK, lineHeight: 1.7, marginTop: "4px" }}>{heating.description}</p>
            </div>
          )}

          <div style={{ flex: 1 }} />
          <Footer pageNum={2} pageTotal={4} />
        </div>

        {/* ══════ PAGE 3 — ITENS DE SÉRIE ══════ */}
        <div data-pdf-page="true" style={PAGE}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Itens de Série" />

          <h2 style={{ fontSize: "20px", fontWeight: 700, color: INK, marginTop: "24px", marginBottom: "6px" }}>
            Itens inclusos no projeto
          </h2>
          <p style={{ fontSize: "10px", color: INK_MUTED, marginBottom: "16px" }}>
            Todos os equipamentos e serviços abaixo estão inclusos no valor da proposta.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", flex: 1 }}>
            {[col1, col2].map((col, ci) => (
              <div key={ci}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", borderBottom: `1.5px solid ${PINK}`, paddingBottom: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "8px", fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>Item</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", width: "32px" }}>Qtd</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right", width: "48px" }}>Status</span>
                </div>
                {col.map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", borderBottom: `1px solid ${SLATE_BORDER}`, padding: "5px 0" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: INK, paddingRight: "6px" }}>{item.name}</div>
                    <div style={{ fontSize: "9px", color: INK_MUTED, fontWeight: 600, width: "32px", textAlign: "center" }}>{item.qty}</div>
                    <div style={{ width: "48px", textAlign: "right" }}>
                      <span style={{ fontSize: "7.5px", fontWeight: 700, padding: "2px 5px", background: `${GREEN}40`, color: "#3d7a4c", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Incluso
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <Footer pageNum={3} pageTotal={4} />
        </div>

        {/* ══════ PAGE 4 — TERMOS E PAGAMENTO ══════ */}
        <div data-pdf-page="true" style={PAGE}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Termos e Pagamento" />

          <section style={{ marginTop: "20px", background: INK, color: "#fff", padding: "22px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: GREEN, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "6px" }}>
                  Investimento Total do Projeto
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{`Para ${data.clientName}`}</div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {formatCurrency(data.proposalValue)}
              </div>
            </div>
          </section>

          <section style={{ marginTop: "22px" }}>
            <SectionLabel color={PINK}>Condições de Pagamento</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "10px" }}>
              <PaymentCard title="À vista" subtitle="Desconto especial" highlight color={PINK} />
              <PaymentCard title="Cartão de crédito" subtitle="Em até 12x sem juros" color={BLUE} />
              <PaymentCard title="Boleto bancário" subtitle="Parcelado conforme negociação" color={GREEN} />
            </div>
            <p style={{ fontSize: "9px", color: INK_MUTED, marginTop: "8px", lineHeight: 1.6 }}>
              Demais condições podem ser negociadas diretamente com o consultor. Consulte prazos e taxas atualizados no fechamento.
            </p>
          </section>

          <section style={{ marginTop: "18px", background: SLATE_BG, borderLeft: `3px solid ${BLUE}`, padding: "12px 16px" }}>
            <SectionLabel color={BLUE}>Validade</SectionLabel>
            <p style={{ fontSize: "10px", color: INK, lineHeight: 1.7, marginTop: "4px" }}>
              {`Este orçamento é válido até `}<strong>{validityDate.toLocaleDateString("pt-BR")}</strong>{` (7 dias corridos a partir da emissão). Após essa data, valores e disponibilidade estão sujeitos a alteração.`}
            </p>
          </section>

          <section style={{ marginTop: "16px" }}>
            <SectionLabel color={INK_MUTED}>Termos Gerais</SectionLabel>
            <ul style={{ fontSize: "9.5px", color: INK_MUTED, lineHeight: 1.7, marginTop: "6px", paddingLeft: "14px" }}>
              <li>O valor inclui escavação padrão, instalação, frete e itens de série relacionados.</li>
              <li>Despesas adicionais (rocha, lençol freático, entulho excedente) serão orçadas separadamente.</li>
              <li>Cliente é responsável por fornecer ponto de água, energia e acesso adequado para entrega.</li>
              <li>Prazo médio de instalação: 15 a 30 dias úteis após confirmação do pedido e preparo do terreno.</li>
            </ul>
          </section>

          <section style={{ marginTop: "22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div style={{ borderTop: `1px solid ${INK}`, paddingTop: "8px", fontSize: "9px", color: INK_MUTED, textAlign: "center" }}>
              {data.clientName}<br /><span style={{ fontSize: "8px" }}>Cliente</span>
            </div>
            <div style={{ borderTop: `1px solid ${INK}`, paddingTop: "8px", fontSize: "9px", color: INK_MUTED, textAlign: "center" }}>
              {data.sellerName}<br /><span style={{ fontSize: "8px" }}>Consultor Splash Piscinas</span>
            </div>
          </section>

          <div style={{ flex: 1 }} />
          <Footer pageNum={4} pageTotal={4} />
        </div>

      </div>
    );
  }
);

QuoteTemplate.displayName = "QuoteTemplate";

// ═══════════ Sub-components ═══════════

function TricolorBar() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: "4px",
      background: `linear-gradient(90deg, ${PINK} 0%, ${PINK} 33.33%, ${BLUE} 33.33%, ${BLUE} 66.66%, ${GREEN} 66.66%, ${GREEN} 100%)`,
    }} />
  );
}

function Header({ dateStr, quoteNumber, pageLabel }: {
  dateStr: string; quoteNumber: string; pageLabel: string;
}) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1.5px solid ${BLUE}40`, paddingBottom: "12px", marginTop: "8px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: INK, letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>
          {"Splash"}<span style={{ color: PINK }}>{"."}</span>
        </h1>
        <p style={{ fontSize: "8px", fontWeight: 700, color: BLUE, letterSpacing: "0.2em", textTransform: "uppercase", margin: "4px 0 0 0" }}>
          {pageLabel === "Capa" ? "Proposta Técnica & Comercial" : pageLabel}
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "8px", color: INK_MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3px" }}>Referência</div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: INK }}>{quoteNumber}</div>
        <div style={{ fontSize: "8px", color: INK_MUTED, marginTop: "2px" }}>{dateStr}</div>
      </div>
    </header>
  );
}

function Footer({ pageNum, pageTotal }: { pageNum: number; pageTotal: number }) {
  return (
    <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${SLATE_BORDER}`, paddingTop: "8px", marginTop: "8px" }}>
      <p style={{ fontSize: "7.5px", color: INK_MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
        Splash Piscinas — Revendedora Autorizada iGUi
      </p>
      <p style={{ fontSize: "7.5px", fontWeight: 700, color: INK, letterSpacing: "0.18em", margin: 0 }}>
        {`PÁG ${String(pageNum).padStart(2, "0")} / ${String(pageTotal).padStart(2, "0")}`}
      </p>
    </footer>
  );
}

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "8px", fontWeight: 700, color, letterSpacing: "0.18em", textTransform: "uppercase", borderLeft: `2px solid ${color}`, paddingLeft: "7px", margin: "0 0 8px 0" }}>
      {children}
    </h3>
  );
}

function SpecCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div style={{ fontSize: "7.5px", color: INK_MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: INK }}>
        {value}{" "}<span style={{ fontSize: "10px", fontWeight: 600, color: INK_MUTED }}>{unit}</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", padding: "8px 14px", borderBottom: last ? "none" : `1px solid ${SLATE_BORDER}`, fontSize: "10px" }}>
      <div style={{ color: INK_MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ color: INK, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function PaymentCard({ title, subtitle, color, highlight }: { title: string; subtitle: string; color: string; highlight?: boolean }) {
  return (
    <div style={{ border: `1px solid ${color}${highlight ? "" : "40"}`, background: highlight ? `${color}14` : "#fff", padding: "12px 14px" }}>
      <div style={{ fontSize: "7.5px", fontWeight: 700, color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "5px" }}>{title}</div>
      <div style={{ fontSize: "9.5px", color: INK, fontWeight: 600 }}>{subtitle}</div>
    </div>
  );
}
