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

const PAGE_STYLE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "18mm 18mm",
  background: "#fff",
  color: INK,
  fontFamily: "'Nunito', sans-serif",
  fontSize: "11px",
  lineHeight: 1.55,
  display: "flex",
  flexDirection: "column",
  pageBreakAfter: "always",
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
    validityDate.setDate(validityDate.getDate() + 15);

    const allItems = [...standardItems];
    if (heating) allItems.push({ name: heating.name, qty: 1, description: heating.description });
    if (data.includeClorador) allItems.push({ name: "Clorador", qty: 1, description: "Sistema de cloração automática" });

    const totalPrice = data.proposalValue;
    const dimParts = size.dimensions.split("x").map((s) => s.trim());
    const [comp, larg, prof] = [dimParts[0] ?? "—", dimParts[1] ?? "—", dimParts[2] ?? "—"];

    return (
      <div ref={ref} style={{ background: "#fff" }}>
        {/* PAGE 1 - COVER */}
        <div style={{ ...PAGE_STYLE }}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Capa" pageNum={1} pageTotal={4} />

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginTop: "36px" }}>
            <div>
              <SectionLabel color={BLUE}>Preparado Para</SectionLabel>
              <div style={{ paddingLeft: "10px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: INK }}>{data.clientName}</div>
                <div style={{ fontSize: "11px", color: INK_MUTED, marginTop: "4px", lineHeight: 1.6 }}>
                  {data.clientAddress && (<>{data.clientAddress}<br /></>)}
                  {data.clientCity}
                  {data.clientEmail && (<><br />{data.clientEmail}</>)}
                </div>
              </div>
            </div>
            <div>
              <SectionLabel color={PINK}>Consultor Responsável</SectionLabel>
              <div style={{ paddingLeft: "10px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: INK }}>{data.sellerName}</div>
                <div style={{ fontSize: "11px", color: INK_MUTED, marginTop: "4px", lineHeight: 1.6 }}>
                  Splash Piscinas iGUi<br />Revendedora Autorizada
                </div>
              </div>
            </div>
          </section>

          <section style={{ background: SLATE_BG, border: `1px solid ${SLATE_BORDER}`, padding: "28px 28px", marginTop: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
                  Modelo Selecionado
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: INK, lineHeight: 1.1 }}>Piscina {model.name}</div>
                <div style={{ fontSize: "11px", color: INK_MUTED, marginTop: "6px" }}>
                  Linha {model.line} · Estrutura em fibra de vidro PRFV reforçado
                </div>
              </div>
              <div style={{ background: PINK, color: "#fff", padding: "5px 12px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Linha {model.line}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", borderTop: `1px solid ${SLATE_BORDER}`, paddingTop: "20px" }}>
              <SpecCell label="Comprimento" value={comp} unit="m" />
              <SpecCell label="Largura" value={larg} unit="m" />
              <SpecCell label="Profundidade" value={prof} unit="m" />
              <SpecCell label="Área" value={size.area.replace(" m²", "")} unit="m²" />
            </div>
            {size.semiPastilha && (
              <div style={{ marginTop: "16px", padding: "10px 14px", background: "#fff", border: `1px solid ${BLUE}`, borderLeft: `3px solid ${BLUE}` }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: BLUE, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: "8px" }}>Acabamento</span>
                <span style={{ fontSize: "11px", color: INK }}>Semi-pastilhada {size.pastilhaSize ? `· ${size.pastilhaSize}` : ""}</span>
              </div>
            )}
          </section>

          <section style={{ marginTop: "auto", paddingTop: "32px" }}>
            <div style={{ background: `${PINK}0d`, border: `1px solid ${PINK}40`, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: PINK, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Investimento Total do Projeto
                </div>
                <div style={{ fontSize: "10px", color: INK_MUTED, marginTop: "8px", maxWidth: "45ch" }}>
                  Valor inclui casco, equipamentos de série, frete logístico e instalação completa.
                  Orçamento válido por 15 dias corridos.
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "30px", fontWeight: 900, color: PINK, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {formatCurrency(totalPrice)}
                </div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: INK, marginTop: "8px" }}>
                  Condições de pagamento facilitadas
                </div>
              </div>
            </div>
          </section>
          <Footer pageNum={1} pageTotal={4} />
        </div>

        {/* PAGE 2 - SPECS */}
        <div style={{ ...PAGE_STYLE }}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Especificações" pageNum={2} pageTotal={4} />
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: INK, marginTop: "32px", marginBottom: "8px", letterSpacing: "-0.01em" }}>
            Detalhes técnicos da piscina
          </h2>
          <p style={{ fontSize: "11px", color: INK_MUTED, marginBottom: "28px" }}>
            Especificações completas do modelo selecionado e equipamentos auxiliares.
          </p>
          <div style={{ border: `1px solid ${SLATE_BORDER}` }}>
            <DetailRow label="Modelo" value={model.name} />
            <DetailRow label="Linha" value={model.line} />
            <DetailRow label="Dimensões (C × L × P)" value={`${size.dimensions} m`} />
            <DetailRow label="Área de espelho d'água" value={size.area} />
            <DetailRow label="Material" value="Fibra de vidro PRFV reforçado" />
            <DetailRow label="Acabamento interno" value={size.semiPastilha ? `Semi-pastilhada ${size.pastilhaSize ? `(${size.pastilhaSize})` : ""}` : "Gel-coat brilhante"} />
            <DetailRow label="Casa de máquinas" value={casaMaquina?.name ?? "—"} />
            <DetailRow label="Aquecimento" value={heating?.name ?? "Não incluso"} />
            <DetailRow label="Clorador automático" value={data.includeClorador ? "Incluso" : "Não incluso"} last />
          </div>
          {casaMaquina && (
            <div style={{ marginTop: "28px", background: `${BLUE}14`, borderLeft: `3px solid ${BLUE}`, padding: "18px 22px" }}>
              <SectionLabel color={BLUE}>{casaMaquina.name}</SectionLabel>
              <p style={{ fontSize: "11px", color: INK, lineHeight: 1.7, marginTop: "6px" }}>{casaMaquina.description}</p>
            </div>
          )}
          {heating && (
            <div style={{ marginTop: "16px", background: `${GREEN}26`, borderLeft: `3px solid ${GREEN}`, padding: "18px 22px" }}>
              <SectionLabel color="#5b9b69">{heating.name}</SectionLabel>
              <p style={{ fontSize: "11px", color: INK, lineHeight: 1.7, marginTop: "6px" }}>{heating.description}</p>
            </div>
          )}
          <Footer pageNum={2} pageTotal={4} />
        </div>

        {/* PAGE 3 - ITEMS */}
        <div style={{ ...PAGE_STYLE }}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Itens de Série" pageNum={3} pageTotal={4} />
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: INK, marginTop: "32px", marginBottom: "8px", letterSpacing: "-0.01em" }}>
            Itens inclusos no projeto
          </h2>
          <p style={{ fontSize: "11px", color: INK_MUTED, marginBottom: "24px" }}>
            Todos os equipamentos e serviços abaixo já estão inclusos no valor da proposta.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${PINK}` }}>
                <th style={thStyle}>Item</th>
                <th style={{ ...thStyle, width: "60px", textAlign: "center" }}>Qtd.</th>
                <th style={{ ...thStyle, width: "80px", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${SLATE_BORDER}` }}>
                  <td style={{ padding: "8px 8px 8px 0" }}>
                    <div style={{ fontWeight: 700, color: INK }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: "9.5px", color: INK_MUTED, marginTop: "2px" }}>{item.description}</div>
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center", color: INK_MUTED, fontWeight: 600 }}>{item.qty}</td>
                  <td style={{ padding: "8px 0 8px 8px", textAlign: "right" }}>
                    <span style={{ fontSize: "8.5px", fontWeight: 800, padding: "3px 8px", background: `${GREEN}40`, color: "#3d7a4c", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Incluso
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Footer pageNum={3} pageTotal={4} />
        </div>

        {/* PAGE 4 - TERMS */}
        <div style={{ ...PAGE_STYLE, pageBreakAfter: "auto" }}>
          <TricolorBar />
          <Header dateStr={dateStr} quoteNumber={quoteNumber} pageLabel="Termos e Pagamento" pageNum={4} pageTotal={4} />
          <section style={{ marginTop: "28px", background: INK, color: "#fff", padding: "28px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: GREEN, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Investimento Total
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Para {data.clientName}</div>
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {formatCurrency(totalPrice)}
              </div>
            </div>
          </section>
          <section style={{ marginTop: "32px" }}>
            <SectionLabel color={PINK}>Condições de Pagamento</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <PaymentCard title="À vista" subtitle="Desconto especial" highlight color={PINK} />
              <PaymentCard title="Cartão de crédito" subtitle="Em até 12x sem juros" color={BLUE} />
              <PaymentCard title="Financiamento" subtitle="Sujeito à aprovação bancária" color={GREEN} />
            </div>
          </section>
          <section style={{ marginTop: "28px", background: SLATE_BG, borderLeft: `3px solid ${BLUE}`, padding: "16px 20px" }}>
            <SectionLabel color={BLUE}>Validade</SectionLabel>
            <p style={{ fontSize: "11px", color: INK, lineHeight: 1.7, marginTop: "6px" }}>
              Este orçamento é válido até <strong>{validityDate.toLocaleDateString("pt-BR")}</strong> (15 dias corridos a partir da emissão).
            </p>
          </section>
          <section style={{ marginTop: "20px" }}>
            <SectionLabel color={PINK}>Garantia</SectionLabel>
            <ul style={{ fontSize: "11px", color: INK, lineHeight: 1.8, marginTop: "8px", paddingLeft: "16px" }}>
              <li><strong>25 anos</strong> de garantia estrutural contra defeitos de fabricação do casco.</li>
              <li><strong>1 ano</strong> de garantia para equipamentos elétricos.</li>
              <li><strong>90 dias</strong> de garantia da instalação e mão de obra.</li>
            </ul>
          </section>
          <section style={{ marginTop: "20px" }}>
            <SectionLabel color={INK_MUTED}>Termos Gerais</SectionLabel>
            <ul style={{ fontSize: "10px", color: INK_MUTED, lineHeight: 1.7, marginTop: "8px", paddingLeft: "16px" }}>
              <li>O valor inclui escavação padrão, instalação, frete e itens de série relacionados.</li>
              <li>Despesas adicionais serão orçadas separadamente.</li>
              <li>Cliente é responsável por fornecer ponto de água, energia e acesso adequado.</li>
              <li>Prazo médio de instalação: 15 a 30 dias úteis após confirmação do pedido.</li>
            </ul>
          </section>
          <section style={{ marginTop: "auto", paddingTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <div style={{ borderTop: `1px solid ${INK}`, paddingTop: "8px", fontSize: "10px", color: INK_MUTED, textAlign: "center" }}>
                {data.clientName}<br /><span style={{ fontSize: "9px" }}>Cliente</span>
              </div>
            </div>
            <div>
              <div style={{ borderTop: `1px solid ${INK}`, paddingTop: "8px", fontSize: "10px", color: INK_MUTED, textAlign: "center" }}>
                {data.sellerName}<br /><span style={{ fontSize: "9px" }}>Consultor Splash Piscinas</span>
              </div>
            </div>
          </section>
          <Footer pageNum={4} pageTotal={4} />
        </div>
      </div>
    );
  }
);

QuoteTemplate.displayName = "QuoteTemplate";

function TricolorBar() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: "5px",
      background: `linear-gradient(90deg, ${PINK} 0%, ${PINK} 33.33%, ${BLUE} 33.33%, ${BLUE} 66.66%, ${GREEN} 66.66%, ${GREEN} 100%)`,
    }} />
  );
}

function Header({ dateStr, quoteNumber, pageLabel, pageNum, pageTotal }: {
  dateStr: string; quoteNumber: string; pageLabel: string; pageNum: number; pageTotal: number;
}) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1.5px solid ${BLUE}40`, paddingBottom: "16px", marginTop: "12px" }}>
      <div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: INK, letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>
          Splash<span style={{ color: PINK }}>.</span>
        </h1>
        <p style={{ fontSize: "9px", fontWeight: 800, color: BLUE, letterSpacing: "0.2em", textTransform: "uppercase", margin: "6px 0 0 0" }}>
          {pageLabel === "Capa" ? "Proposta Técnica & Comercial" : pageLabel}
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "9px", color: INK_MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Referência</div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: INK }}>{quoteNumber}</div>
        <div style={{ fontSize: "9px", color: INK_MUTED, marginTop: "2px" }}>{dateStr}</div>
      </div>
    </header>
  );
}

function Footer({ pageNum, pageTotal }: { pageNum: number; pageTotal: number }) {
  return (
    <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${SLATE_BORDER}`, paddingTop: "12px", marginTop: "20px" }}>
      <p style={{ fontSize: "8.5px", color: INK_MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
        Splash Piscinas — Revendedora Autorizada iGUi
      </p>
      <p style={{ fontSize: "8.5px", fontWeight: 700, color: INK, letterSpacing: "0.18em", margin: 0 }}>
        PÁG {String(pageNum).padStart(2, "0")} / {String(pageTotal).padStart(2, "0")}
      </p>
    </footer>
  );
}

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "9px", fontWeight: 800, color, letterSpacing: "0.18em", textTransform: "uppercase", borderLeft: `2px solid ${color}`, paddingLeft: "8px", margin: "0 0 10px 0" }}>
      {children}
    </h3>
  );
}

function SpecCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div style={{ fontSize: "8.5px", color: INK_MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 800, color: INK }}>
        {value} <span style={{ fontSize: "11px", fontWeight: 600, color: INK_MUTED }}>{unit}</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", padding: "10px 16px", borderBottom: last ? "none" : `1px solid ${SLATE_BORDER}`, fontSize: "11px" }}>
      <div style={{ color: INK_MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ color: INK, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function PaymentCard({ title, subtitle, color, highlight }: { title: string; subtitle: string; color: string; highlight?: boolean }) {
  return (
    <div style={{ border: `1px solid ${color}${highlight ? "" : "40"}`, background: highlight ? `${color}14` : "#fff", padding: "14px 16px" }}>
      <div style={{ fontSize: "8.5px", fontWeight: 800, color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>{title}</div>
      <div style={{ fontSize: "10.5px", color: INK, fontWeight: 600 }}>{subtitle}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase",
  color: INK_MUTED, padding: "0 8px 10px 0", textAlign: "left",
};
