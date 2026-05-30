"use client";

import { useParams } from "next/navigation";
import { usePersonaStore } from "@/stores/persona-store";
import { MOCK_PERSONAS } from "@/data";
import type { Persona } from "@/types";
import { usePersona } from "@/hooks/use-queries";
import { isMockModeClient } from "@/lib/mock-mode-client";

export function usePersonaFromRoute(): Persona {
  const params = useParams<{ personaId: string }>();
  const personas = usePersonaStore((s) => s.personas);
  const storePersona = personas.find((p) => p.id === params?.personaId);

  // PERF: o store (carregado pelo PersonaStoreSync via personas.list) já traz a
  // persona COMPLETA com métricas. Só batemos no servidor (getPersonaById, que
  // re-roda getPersonaMetrics ≈ 6 queries Drizzle) quando a persona ainda não
  // está no store — elimina esse custo redundante em TODA navegação de persona.
  const { data: dbPersona } = usePersona(storePersona ? null : params?.personaId);

  if (storePersona || dbPersona) {
    return (storePersona ?? (dbPersona as Persona))!;
  }

  if (!isMockModeClient) {
    return {
      id: params?.personaId ?? "",
      workspaceId: "",
      name: "Persona nao encontrada",
      status: "archived",
    } as Persona;
  }

  return (
    MOCK_PERSONAS.find((p) => p.id === params?.personaId) ??
    MOCK_PERSONAS[0]
  );
}
