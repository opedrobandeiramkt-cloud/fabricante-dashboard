import "dotenv/config";
import { prisma } from "./lib/prisma.js";
import { hashPassword } from "./lib/crypto.js";

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


async function main() {
  console.log("🌱 Iniciando seed...");

  // Cria (ou atualiza) tenant iGUi
  const tenant = await prisma.tenant.upsert({
    where:  { slug: "igui" },
    create: { name: "iGUi Piscinas", slug: "igui" },
    update: { name: "iGUi Piscinas" },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // Cria ou atualiza etapas do funil por orderIndex (preserva referências existentes)
  for (const stage of STAGES) {
    const existing = await prisma.funnelStage.findFirst({
      where: { tenantId: tenant.id, orderIndex: stage.orderIndex },
    });
    if (existing) {
      await prisma.funnelStage.update({
        where: { id: existing.id },
        data: { key: stage.key, label: stage.label, isWon: stage.isWon, isLost: stage.isLost },
      });
    } else {
      await prisma.funnelStage.create({ data: { tenantId: tenant.id, ...stage } });
    }
  }
  console.log(`✅ ${STAGES.length} etapas do funil processadas`);

  // Cria usuário admin padrão (só se não existir)
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@igui.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin2024";
  const existingAdmin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        tenantId:       tenant.id,
        email:          adminEmail,
        passwordHash:   await hashPassword(adminPassword),
        name:           "Admin",
        role:           "admin",
        storeIds:       [],
        avatarInitials: "AD",
      },
    });
    console.log(`✅ Admin criado: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`✅ Admin já existe: ${adminEmail}`);
  }

  console.log("\n🎉 Seed concluído!\n");
  console.log("Tenant slug para usar nos requests: igui");
  console.log("Exemplo de evento webhook:");
  console.log(JSON.stringify({
    event_id:          "evt-001",
    crm_source:        "chatwoot",
    tenant_slug:       "igui",
    store_external_id: "id-externo-da-loja-no-crm",
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
