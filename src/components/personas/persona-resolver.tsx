"use client";

import { useParams } from "next/navigation";
import { usePersonaStore } from "@/stores/persona-store";
import { MOCK_PERSONAS } from "@/data";
import type { Persona } from "@/types";
import { usePersona } from "@/hooks/use-queries";
import { isMockModeClient } from "@/lib/mock-mode-client";

export function usePersonaFromRoute(): Persona {
  const params = useParams<{ personaId: string }>();
  const { data: dbPersona } = usePersona(params?.personaId);
  const { personas } = usePersonaStore();
  const storePersona = personas.find((p) => p.id === params?.personaId);

  if (dbPersona || storePersona) {
    return ((dbPersona as Persona | undefined) ?? storePersona)!;
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
