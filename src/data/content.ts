import type { ContentItem } from "@/types";
import { MOCK_USERS } from "./core";

const owner = MOCK_USERS[2];
const today = new Date();
const dayOffset = (d: number, hour = 18) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  x.setHours(hour, 0, 0, 0);
  return x.toISOString();
};

export const MOCK_CONTENT: ContentItem[] = [
  {
    id: "c_001",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "instagram",
    contentType: "reel",
    title: "Hook: 'A vida que você adia te custa caro'",
    hook: "A vida que você adia te custa caro.",
    script:
      "Cena 1: Espelho · Aurora se observa em silêncio · 2s\nCena 2: Voz baixa · 'Você jura que está esperando o momento certo' · 3s\nCena 3: Sobreposição rápida de cenas adiadas · 4s\nCena 4: CTA · 'O ritual começa quando você decide.'",
    caption:
      "Cada dia que você adia, você assina um contrato silencioso com a versão menor de você.",
    visualBrief: "Tons quentes, neutros, película 35mm.",
    audioReference: "trend · 'sad strings · slow build'",
    pillar: "authority",
    status: "scheduled",
    scheduledAt: dayOffset(1, 18),
    owner,
    metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    },
  },
  {
    id: "c_002",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "instagram",
    contentType: "feed",
    title: "Carrossel · 5 verdades sobre presença feminina",
    pillar: "educational",
    status: "scripted",
    scheduledAt: dayOffset(2, 12),
    owner,
    caption: "5 verdades que toda mulher silencia até ser tarde.",
  },
  {
    id: "c_003",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "instagram",
    contentType: "story",
    title: "Sequência 4 telas · bastidor do reel 003",
    pillar: "behind",
    status: "editing",
    scheduledAt: dayOffset(0, 21),
    owner,
  },
  {
    id: "c_004",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "tiktok",
    contentType: "short",
    title: "POV · 'Quando você decide parar de pedir licença'",
    hook: "POV: o momento exato em que você decide parar de pedir licença.",
    pillar: "opinion",
    status: "posted",
    publishedAt: dayOffset(-2, 19),
    owner,
    metrics: {
      views: 184_320,
      likes: 21_400,
      comments: 1_240,
      shares: 4_120,
      saves: 6_840,
      retention: 62,
      engagementRate: 6.8,
    },
  },
  {
    id: "c_005",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "tiktok",
    contentType: "short",
    title: "Aurora ensina · gesto de presença",
    pillar: "tips",
    status: "recorded",
    scheduledAt: dayOffset(3, 19),
    owner,
  },
  {
    id: "c_006",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333302",
    channel: "tiktok",
    contentType: "short",
    title: "Stack 2026 · benchmark brutal",
    pillar: "authority",
    status: "scheduled",
    scheduledAt: dayOffset(1, 21),
    owner,
  },
  {
    id: "c_007",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333302",
    channel: "instagram",
    contentType: "carousel",
    title: "Carrossel · os 7 erros mortais em React 19",
    pillar: "tips",
    status: "posted",
    publishedAt: dayOffset(-5, 18),
    owner,
    metrics: {
      views: 92_140,
      likes: 8_420,
      comments: 612,
      shares: 1_840,
      saves: 11_240,
      engagementRate: 7.2,
    },
  },
  {
    id: "c_008",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "instagram",
    contentType: "story",
    title: "Story · oferta soft · pré-lançamento",
    pillar: "offer",
    status: "idea",
    scheduledAt: dayOffset(5, 9),
    owner,
  },
  {
    id: "c_009",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "email",
    contentType: "email",
    title: "Email 03 · 'A janela está fechando'",
    pillar: "offer",
    status: "scripted",
    scheduledAt: dayOffset(4, 7),
    owner,
  },
  {
    id: "c_010",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "instagram",
    contentType: "reel",
    title: "Reel · 'O custo do silêncio'",
    pillar: "authority",
    status: "idea",
    owner,
  },
];

export function contentByPersona(personaId: string) {
  return MOCK_CONTENT.filter((c) => c.personaId === personaId);
}

