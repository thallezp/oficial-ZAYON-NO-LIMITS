"use client";

import { useParams } from "next/navigation";
import { usePersonaStore } from "@/stores/persona-store";
import { MOCK_PERSONAS } from "@/data";
import type { Persona } from "@/types";

export function usePersonaFromRoute(): Persona {
  const params = useParams<{ personaId: string }>();
  const storePersona = usePersonaStore((s) =>
    s.personas.find((p) => p.id === params?.personaId),
  );
  return (
    storePersona ??
    MOCK_PERSONAS.find((p) => p.id === params?.personaId) ??
    MOCK_PERSONAS[0]
  );
}
