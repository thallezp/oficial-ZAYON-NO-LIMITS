import type { Lead } from "@/types";
import { MOCK_USERS } from "./core";

const ago = (d: number, h = 9) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, 0, 0, 0);
  return x.toISOString();
};

const sources = ["Instagram Form", "TikTok bio", "Direct WhatsApp", "Página Aurora", "YouTube descrição"];

export const MOCK_LEADS: Lead[] = Array.from({ length: 28 }, (_, i) => {
  const statusPool: Lead["status"][] = [
    "open",
    "approached",
    "qualified",
    "converted",
    "lost",
    "no_response",
  ];
  const status = statusPool[i % statusPool.length];
  const personaId = i % 3 === 0 ? "p_obsidian" : "p_aurora";
  return {
    id: `l_${1000 + i}`,
    workspaceId: "ws_nexus",
    personaId,
    name: [
      "Helena Pires",
      "Camila Reis",
      "André Salles",
      "Bruna Oliveira",
      "Pedro Vasconcelos",
      "Larissa Mota",
      "Fernanda Carvalho",
      "Igor Lima",
    ][i % 8],
    email: `lead${i + 1}@gmail.com`,
    phone: `+55 11 9${String(80000000 + i * 137).padStart(8, "0")}`,
    instagram: `@user_${i + 1}`,
    campaign: i % 2 === 0 ? "Pré-lançamento Aurora Q2" : "Captação orgânica",
    source: sources[i % sources.length],
    status,
    score: Math.floor(Math.random() * 40) + 60,
    responsible: MOCK_USERS[(i % 4) + 1],
    notes:
      i % 3 === 0
        ? "Trabalha com criação de conteúdo. Mostrou interesse alto em pegada cinematográfica."
        : undefined,
    convertedValue: status === "converted" ? Math.floor(Math.random() * 4) * 997 + 1997 : undefined,
    answers: [
      {
        question: "Qual o seu maior desafio hoje?",
        answer:
          "Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.",
      },
      {
        question: "Quanto faturou nos últimos 30 dias?",
        answer: ["0-3k", "3-10k", "10-30k", "30k+"][i % 4],
      },
      {
        question: "Está pronta para investir agora?",
        answer: i % 2 === 0 ? "Sim, totalmente" : "Em até 30 dias",
      },
    ],
    createdAt: ago(i, (i % 12) + 8),
  };
});
