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

const PINK        = "#E60A80";
const NAVY        = "#1B2A4A";
const INK         = "#1a1a2e";
const INK_MUTED   = "#64748b";
const SLATE_BG    = "#f8fafc";
const SLATE_BD    = "#e2e8f0";
const ROW_ALT     = "#f1f5f9";

// fontWeight stays ≤ 700 — fontWeight 800 causes html2canvas to collapse spaces.
const PAGE: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  padding: "44px 48px 36px",
  background: "#fff",
  color: INK,
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  fontSize: 11,
  lineHeight: 1.5,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

export const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  ({ data }, ref) => {
    const allModels   = loadPoolModels();
    const allSizes    = loadPoolSizes();
    const model       = allModels.find((m) => m.id === data.poolModelId);
    const size        = allSizes.find((s) => s.id === data.poolSizeId);
    const heating     = data.heatingId ? heatingOptions.find((h) => h.id === data.heatingId) : null;
    const casaMaquina = casasDeMaquina.find((c) => c.id === data.casaDeMaquinaId);

    if (!model || !size) return null;

    const today     = new Date();
    const dateStr   = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const quoteNum  = `SP-${today.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const validity  = new Date(today);
    validity.setDate(validity.getDate() + 7);
    const validStr  = validity.toLocaleDateString("pt-BR");

    const allItems = [...standardItems];
    if (heating)           allItems.push({ name: heating.name,         qty: 1, description: heating.description });
    if (data.includeClorador) allItems.push({ name: "Clorador Automático", qty: 1 });

    const dimParts = size.dimensions.split("x").map((s) => s.trim());
    const [comp, larg, prof] = [dimParts[0] ?? "—", dimParts[1] ?? "—", dimParts[2] ?? "—"];

    return (
      <div ref={ref} style={{ background: "#fff" }}>

        {/* ══ PAGE 1 — CAPA ══ */}
        <div data-pdf-page="true" style={PAGE}>
          <PageHeader quoteNum={quoteNum} dateStr={dateStr} />

          {/* "PROPOSTA TÉCNICA & COMERCIAL" */}
          <div style={{ fontSize: 9, fontWeight: 700, color: INK_MUTED, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 20, marginBottom: 24 }}>
            Proposta Técnica & Comercial
          </div>

          {/* Client + Consultant */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
            <div style={{ borderLeft: `3px solid #6FCAF1`, paddingLeft: 14 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#6FCAF1", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                Preparado Para
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: 6 }}>{data.clientName}</div>
              <div style={{ fontSize: 11, color: INK_MUTED }}>
                {data.clientCity}
                {data.clientAddress && <><br />{data.clientAddress}</>}
                {data.clientEmail   && <><br />{data.clientEmail}</>}
              </div>
            </div>
            <div style={{ borderLeft: `3px solid ${PINK}`, paddingLeft: 14 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: PINK, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                Consultor Responsável
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: 6 }}>{data.sellerName}</div>
              <div style={{ fontSize: 11, color: INK_MUTED }}>
                Splash Piscinas iGUi<br />Revendedora Autorizada
              </div>
            </div>
          </div>

          {/* Model card */}
          <div style={{ background: SLATE_BG, border: `1px solid ${SLATE_BD}`, padding: "22px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: INK_MUTED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                  Modelo Selecionado
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: 4 }}>{`Piscina ${model.name}`}</div>
                <div style={{ fontSize: 10, color: INK_MUTED }}>{`Linha ${model.line} · Estrutura em fibra de vidro PRFV reforçado`}</div>
              </div>
              <div style={{ background: PINK, color: "#fff", padding: "5px 12px", fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", flexShrink: 0 }}>
                {`Linha ${model.line}`}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, borderTop: `1px solid ${SLATE_BD}`, paddingTop: 16 }}>
              <SpecCell label="Comprimento" value={comp} unit="m" />
              <SpecCell label="Largura"     value={larg} unit="m" />
              <SpecCell label="Profundidade" value={prof} unit="m" />
            </div>
          </div>

          {/* Investment box — dark navy */}
          <div style={{ background: NAVY, padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Investimento Total do Projeto
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: "38ch" }}>
                Inclui casco, equipamentos de série, frete e instalação completa.<br />
                Orçamento válido por 7 dias corridos.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {formatCurrency(data.proposalValue)}
              </div>
              <div style={{ fontSize: 10, color: PINK, marginTop: 6 }}>
                Condições de pagamento facilitadas
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <PageFooter pageNum={1} pageTotal={4} />
        </div>

        {/* ══ PAGE 2 — ESPECIFICAÇÕES ══ */}
        <div data-pdf-page="true" style={PAGE}>
          <PageHeader quoteNum={quoteNum} dateStr={dateStr} />

          <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "24px 0 6px" }}>
            Detalhes técnicos da piscina
          </h2>
          <p style={{ fontSize: 11, color: INK_MUTED, margin: "0 0 20px" }}>
            Especificações completas do modelo selecionado e equipamentos auxiliares.
          </p>

          <div style={{ border: `1px solid ${SLATE_BD}` }}>
            <DetailRow label="Modelo"               value={model.name}                         shade />
            <DetailRow label="Linha"                value={model.line}                          />
            <DetailRow label="Dimensões (C × L × P)" value={`${comp} × ${larg} × ${prof} m`} shade />
            <DetailRow label="Material"             value="Fibra de vidro PRFV reforçado"       />
            <DetailRow label="Acabamento interno"   value={size.semiPastilha ? `Semi-pastilhada${size.pastilhaSize ? ` (${size.pastilhaSize})` : ""}` : "Gel-coat brilhante"} shade />
            <DetailRow label="Casa de máquinas"     value={casaMaquina?.name ?? "—"}            />
            <DetailRow label="Aquecimento"          value={heating?.name ?? "Não incluso"}     shade />
            <DetailRow label="Clorador automático"  value={data.includeClorador ? "Incluso" : "Não incluso"} last />
          </div>

          {/* Equipment cards — side by side */}
          <div style={{ display: "grid", gridTemplateColumns: casaMaquina && heating ? "1fr 1fr" : "1fr", gap: 12, marginTop: 20 }}>
            {casaMaquina && (
              <div style={{ background: SLATE_BG, padding: "14px 16px" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: PINK, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                  {casaMaquina.name}
                </div>
                <div style={{ fontSize: 10, color: INK, lineHeight: 1.6 }}>{casaMaquina.description}</div>
              </div>
            )}
            {heating && (
              <div style={{ background: SLATE_BG, padding: "14px 16px" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: PINK, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
                  {heating.name}
                </div>
                <div style={{ fontSize: 10, color: INK, lineHeight: 1.6 }}>{heating.description}</div>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />
          <PageFooter pageNum={2} pageTotal={4} />
        </div>

        {/* ══ PAGE 3 — ITENS DE SÉRIE ══ */}
        <div data-pdf-page="true" style={PAGE}>
          <PageHeader quoteNum={quoteNum} dateStr={dateStr} />

          <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "24px 0 6px" }}>
            Itens inclusos no projeto
          </h2>
          <p style={{ fontSize: 11, color: INK_MUTED, margin: "0 0 16px" }}>
            Todos os equipamentos e serviços abaixo estão inclusos no valor da proposta.
          </p>

          {/* Single full-width table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: NAVY }}>
                <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Item
                </th>
                <th style={{ padding: "9px 14px", textAlign: "center", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.14em", textTransform: "uppercase", width: 52 }}>
                  Qtd
                </th>
                <th style={{ padding: "9px 14px", textAlign: "center", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.14em", textTransform: "uppercase", width: 80 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ROW_ALT }}>
                  <td style={{ padding: "7px 14px", fontSize: 10, fontWeight: 700, color: INK, borderBottom: `1px solid ${SLATE_BD}` }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "7px 14px", fontSize: 10, color: INK_MUTED, textAlign: "center", borderBottom: `1px solid ${SLATE_BD}` }}>
                    {item.qty}
                  </td>
                  <td style={{ padding: "7px 14px", textAlign: "center", borderBottom: `1px solid ${SLATE_BD}` }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Incluso
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ flex: 1 }} />
          <PageFooter pageNum={3} pageTotal={4} />
        </div>

        {/* ══ PAGE 4 — TERMOS E PAGAMENTO ══ */}
        <div data-pdf-page="true" style={PAGE}>
          <PageHeader quoteNum={quoteNum} dateStr={dateStr} />

          <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "24px 0 20px" }}>
            Termos e Pagamento
          </h2>

          {/* Investment box dark */}
          <div style={{ background: NAVY, padding: "22px 28px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>
                Investimento Total do Projeto
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{`Para ${data.clientName}`}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {formatCurrency(data.proposalValue)}
              </div>
              <div style={{ fontSize: 10, color: PINK, marginTop: 6 }}>Condições de pagamento facilitadas</div>
            </div>
          </div>

          {/* Payment conditions */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
              Condições de Pagamento
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${SLATE_BD}` }}>
              <thead>
                <tr>
                  <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase", background: PINK, width: "33%" }}>
                    À Vista
                  </th>
                  <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", borderLeft: `1px solid ${SLATE_BD}`, width: "33%" }}>
                    Cartão de Crédito
                  </th>
                  <th style={{ padding: "9px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: INK_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", borderLeft: `1px solid ${SLATE_BD}`, width: "34%" }}>
                    Boleto Bancário
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: INK }}>Desconto especial</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: INK, borderLeft: `1px solid ${SLATE_BD}` }}>Em até 3× sem juros</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: INK, borderLeft: `1px solid ${SLATE_BD}` }}>Parcelado conforme negociação</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 9, color: INK_MUTED, marginTop: 8, lineHeight: 1.6 }}>
              Demais condições podem ser negociadas diretamente com o consultor. Consulte prazos e taxas atualizados no fechamento.
            </p>
          </div>

          {/* Validity + Installation side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: SLATE_BG, padding: "14px 16px", border: `1px solid ${SLATE_BD}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Validade
              </div>
              <p style={{ fontSize: 10, color: INK, lineHeight: 1.7, margin: 0 }}>
                {`Este orçamento é válido até `}<strong>{validStr}</strong>{` (7 dias corridos a partir da emissão). Após essa data, valores e disponibilidade estão sujeitos a alteração.`}
              </p>
            </div>
            <div style={{ background: SLATE_BG, padding: "14px 16px", border: `1px solid ${SLATE_BD}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Prazo de Instalação
              </div>
              <p style={{ fontSize: 10, color: INK, lineHeight: 1.7, margin: 0 }}>
                Prazo médio de <strong>15 a 30 dias úteis</strong> após confirmação do pedido e preparo do terreno pelo cliente.
              </p>
            </div>
          </div>

          {/* Terms */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: PINK, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
              Termos Gerais
            </div>
            <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 10, color: INK_MUTED, lineHeight: 1.8 }}>
              <li>O valor inclui escavação padrão, instalação, frete e itens de série relacionados.</li>
              <li>Despesas adicionais (rocha, lençol freático, entulho excedente) serão orçadas separadamente.</li>
              <li>O cliente é responsável por fornecer ponto de água, energia e acesso adequado para entrega.</li>
              <li>Prazo médio de instalação: 15 a 30 dias úteis após confirmação do pedido e preparo do terreno.</li>
            </ul>
          </div>

          <div style={{ flex: 1 }} />
          <PageFooter pageNum={4} pageTotal={4} withContact />
        </div>

      </div>
    );
  }
);

QuoteTemplate.displayName = "QuoteTemplate";

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({ quoteNum, dateStr }: { quoteNum: string; dateStr: string }) {
  return (
    <header style={{ display: "flex", alignItems: "baseline", gap: 0, borderBottom: `1px solid ${SLATE_BD}`, paddingBottom: 10 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: "#E60A80", letterSpacing: "-0.01em" }}>Splash</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{`.${quoteNum} · ${dateStr}`}</span>
    </header>
  );
}

function PageFooter({ pageNum, pageTotal, withContact }: { pageNum: number; pageTotal: number; withContact?: boolean }) {
  return (
    <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${SLATE_BD}`, paddingTop: 8, marginTop: 8 }}>
      <p style={{ fontSize: 8, color: "#64748b", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>
        {withContact
          ? "Splash Piscinas · Revendedora Autorizada iGUi · splashpiscinas.com · 0800 877 5274"
          : "SPLASH PISCINAS · Revendedora Autorizada iGUi"}
      </p>
      <p style={{ fontSize: 8, color: "#1a1a2e", fontWeight: 700, margin: 0 }}>
        {`Pág. ${pageNum} / ${pageTotal}`}
      </p>
    </footer>
  );
}

function SpecCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: "#64748b", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>
        {value}{" "}<span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{unit}</span>
      </div>
    </div>
  );
}

function DetailRow({ label, value, shade, last }: { label: string; value: string; shade?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "200px 1fr",
      padding: "9px 14px",
      borderBottom: last ? "none" : `1px solid ${SLATE_BD}`,
      background: shade ? ROW_ALT : "#fff",
      fontSize: 11,
    }}>
      <div style={{ color: "#64748b", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#1a1a2e", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
