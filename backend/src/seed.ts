import "dotenv/config";
import { prisma } from "./lib/prisma.js";

const STAGES = [
  { key: "lead_capturado",       label: "Lead Capturado",            orderIndex: 1, isWon: false, isLost: false },
  { key: "visita_agendada",      label: "Visita Técnica Agendada",   orderIndex: 2, isWon: false, isLost: false },
  { key: "visita_realizada",     label: "Visita Realizada",          orderIndex: 3, isWon: false, isLost: false },
  { key: "projeto_3d",           label: "Elaboração de Projeto 3D",  orderIndex: 4, isWon: false, isLost: false },
  { key: "orcamento_enviado",    label: "Orçamento Enviado",         orderIndex: 5, isWon: false, isLost: false },
  { key: "negociacao",           label: "Em Negociação",             orderIndex: 6, isWon: false, isLost: false },
  { key: "contrato_enviado",     label: "Contrato Enviado",          orderIndex: 7, isWon: false, isLost: false },
  { key: "aguardando_pagamento", label: "Aguardando Pagamento",      orderIndex: 8, isWon: false, isLost: false },
  { key: "pagamento_aprovado",   label: "Pagamento Aprovado",        orderIndex: 9, isWon: true,  isLost: false },
];

const STORES = [
  { externalId: "loja-sp-01", name: "iGUi São Paulo Centro",  city: "São Paulo",      state: "SP" },
  { externalId: "loja-sp-02", name: "iGUi Campinas",           city: "Campinas",       state: "SP" },
  { externalId: "loja-pr-01", name: "iGUi Curitiba",           city: "Curitiba",       state: "PR" },
  { externalId: "loja-mg-01", name: "iGUi Belo Horizonte",     city: "Belo Horizonte", state: "MG" },
  { externalId: "loja-rj-01", name: "iGUi Rio de Janeiro",     city: "Rio de Janeiro", state: "RJ" },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // Cria (ou atualiza) tenant iGUi
  const tenant = await prisma.tenant.upsert({
    where:  { slug: "igui" },
    create: { name: "iGUi Piscinas", slug: "igui" },
    update: { name: "iGUi Piscinas" },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // Cria etapas do funil
  for (const stage of STAGES) {
    await prisma.funnelStage.upsert({
      where:  { tenantId_key: { tenantId: tenant.id, key: stage.key } },
      create: { tenantId: tenant.id, ...stage },
      update: { label: stage.label, orderIndex: stage.orderIndex },
    });
  }
  console.log(`✅ ${STAGES.length} etapas do funil criadas`);

  // Cria lojas
  for (const store of STORES) {
    await prisma.store.upsert({
      where:  { tenantId_externalId: { tenantId: tenant.id, externalId: store.externalId } },
      create: { tenantId: tenant.id, ...store },
      update: { name: store.name },
    });
  }
  console.log(`✅ ${STORES.length} lojas criadas`);

  console.log("\n🎉 Seed concluído!\n");
  console.log("Tenant slug para usar nos requests: igui");
  console.log("Exemplo de evento webhook:");
  console.log(JSON.stringify({
    event_id:          "evt-001",
    crm_source:        "chatwoot",
    tenant_slug:       "igui",
    store_external_id: "loja-sp-01",
    lead_external_id:  "lead-123",
    from_stage:        null,
    to_stage:          "lead_capturado",
    occurred_at:       new Date().toISOString(),
    metadata:          { value: 45000, salesperson: "Carlos Silva" },
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
