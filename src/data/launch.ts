import type { LaunchCampaign } from "@/types";

const today = new Date();

const dateOffset = (days: number) => {
  const value = new Date(today);
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

export const MOCK_LAUNCH_CAMPAIGNS: LaunchCampaign[] = [
  {
    id: "launch_001",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    name: "Aurora Signature 7D",
    description: "Lançamento principal da oferta premium com aquecimento audiovisual e fechamento em WhatsApp.",
    startsAt: dateOffset(-10),
    endsAt: dateOffset(14),
    status: "active",
    goal: "Converter 45 clientes com uma oferta high-ticket validada pelo funil atual.",
    metadata: {
      funnelId: "fn_aurora",
      linkedTaskIds: ["t_001", "t_002", "t_003"],
      linkedContentIds: ["c_001", "c_003", "c_009"],
      linkedDocumentIds: ["d_003"],
      linkedMaterialIds: ["m_001", "m_002"],
      phaseNotes: {
        research: "Refinar promessas e objeções antes do aquecimento.",
        warming: "Abrir narrativa de transformação e bastidores.",
        capture: "Empurrar lead magnet e direct CTA.",
        event: "Live manifesto com prova social.",
        sale: "Oferta principal com follow-up diário.",
        closing: "Urgência real com bônus e deadline.",
        post_sale: "Onboarding e coleta de depoimentos.",
      },
      copyPlan:
        "Sequência de 5 emails, 3 mensagens de WhatsApp, 2 páginas de venda e 4 scripts de criativos.",
      creativeScripts:
        "Criativos com abertura emocional, quebra de padrão e CTA para direct/WhatsApp.",
      emails:
        "Email E01 descoberta, E02 objeções, E03 prova, E04 oferta, E05 fechamento.",
      whatsapp:
        "Pré-qualificação, follow-up 24h e fechamento de carrinho.",
      salesPages:
        "Página principal, página de checkout e página de recuperação.",
    },
    createdAt: dateOffset(-18),
    events: [
      {
        id: "launch_evt_001",
        campaignId: "launch_001",
        title: "Live de manifesto",
        description: "Abrir narrativa da campanha e ativar CTA para direct.",
        startAt: dateOffset(3),
        type: "live",
      },
      {
        id: "launch_evt_002",
        campaignId: "launch_001",
        title: "Fechamento do carrinho",
        description: "Último disparo de WhatsApp e email.",
        startAt: dateOffset(10),
        type: "deadline",
      },
    ],
    copies: [
      {
        id: "copy_001",
        workspaceId: "11111111-1111-1111-1111-111111111111",
        personaId: "33333333-3333-3333-3333-333333333301",
        campaignId: "launch_001",
        type: "sales_page",
        title: "Página principal · Aurora Signature",
        body: "A promessa central conecta reposicionamento, desejo e urgência sem soar apelativa.",
        status: "approved",
        createdAt: dateOffset(-5),
        updatedAt: dateOffset(-1),
      },
      {
        id: "copy_002",
        workspaceId: "11111111-1111-1111-1111-111111111111",
        personaId: "33333333-3333-3333-3333-333333333301",
        campaignId: "launch_001",
        type: "email",
        title: "E03 · A janela está fechando",
        body: "Email com tensão narrativa e CTA para o fechamento do carrinho.",
        status: "draft",
        createdAt: dateOffset(-4),
        updatedAt: dateOffset(-2),
      },
    ],
  },
];
