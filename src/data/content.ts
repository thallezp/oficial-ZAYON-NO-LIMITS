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
    title: "Hook: 'A vida que vocÃª adia te custa caro'",
    hook: "A vida que vocÃª adia te custa caro.",
    script:
      "Cena 1: Espelho Â· Aurora se observa em silÃªncio Â· 2s\nCena 2: Voz baixa Â· 'VocÃª jura que estÃ¡ esperando o momento certo' Â· 3s\nCena 3: SobreposiÃ§Ã£o rÃ¡pida de cenas adiadas Â· 4s\nCena 4: CTA Â· 'O ritual comeÃ§a quando vocÃª decide.'",
    caption:
      "Cada dia que vocÃª adia, vocÃª assina um contrato silencioso com a versÃ£o menor de vocÃª.",
    visualBrief: "Tons quentes, neutros, pelÃ­cula 35mm.",
    audioReference: "trend Â· 'sad strings Â· slow build'",
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
    title: "Carrossel Â· 5 verdades sobre presenÃ§a feminina",
    pillar: "educational",
    status: "scripted",
    scheduledAt: dayOffset(2, 12),
    owner,
    caption: "5 verdades que toda mulher silencia atÃ© ser tarde.",
  },
  {
    id: "c_003",
    workspaceId: "11111111-1111-1111-1111-111111111111",
    personaId: "33333333-3333-3333-3333-333333333301",
    channel: "instagram",
    contentType: "story",
    title: "SequÃªncia 4 telas Â· bastidor do reel 003",
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
    title: "POV Â· 'Quando vocÃª decide parar de pedir licenÃ§a'",
    hook: "POV: o momento exato em que vocÃª decide parar de pedir licenÃ§a.",
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
    title: "Aurora ensina Â· gesto de presenÃ§a",
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
    title: "Stack 2026 Â· benchmark brutal",
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
    title: "Carrossel Â· os 7 erros mortais em React 19",
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
    title: "Story Â· oferta soft Â· prÃ©-lanÃ§amento",
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
    title: "Email 03 Â· 'A janela estÃ¡ fechando'",
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
    title: "Reel Â· 'O custo do silÃªncio'",
    pillar: "authority",
    status: "idea",
    owner,
  },
];

export function contentByPersona(personaId: string) {
  return MOCK_CONTENT.filter((c) => c.personaId === personaId);
}

