"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Persona } from "@/types";

interface PersonaState {
  personas: Persona[];
  activePersonaId: string | null;
  setPersonas: (personas: Persona[]) => void;
  setActivePersona: (id: string | null) => void;
  upsertPersona: (persona: Persona) => void;
  removePersona: (id: string) => void;
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      personas: [],
      activePersonaId: null,
      setPersonas: (personas) =>
        set((state) => {
          // valida que o ID persistido existe nas personas reais carregadas
          const persistedIsValid =
            state.activePersonaId !== null &&
            personas.some((p) => p.id === state.activePersonaId);
          return {
            personas,
            activePersonaId: persistedIsValid
              ? state.activePersonaId
              : personas[0]?.id ?? null,
          };
        }),
      setActivePersona: (id) => set({ activePersonaId: id }),
      upsertPersona: (persona) =>
        set((state) => {
          const exists = state.personas.find((p) => p.id === persona.id);
          return {
            personas: exists
              ? state.personas.map((p) => (p.id === persona.id ? persona : p))
              : [...state.personas, persona],
          };
        }),
      removePersona: (id) =>
        set((state) => ({
          personas: state.personas.filter((p) => p.id !== id),
          activePersonaId:
            state.activePersonaId === id
              ? state.personas[0]?.id ?? null
              : state.activePersonaId,
        })),
    }),
    {
      name: "zayon.persona",
      version: 2,
      partialize: (state) => ({ activePersonaId: state.activePersonaId }),
      migrate: (persisted: any, fromVersion) => {
        if (fromVersion < 2) {
          return { activePersonaId: null };
        }
        return persisted;
      },
    },
  ),
);

export function useActivePersona() {
  return usePersonaStore((state) =>
    state.personas.find((p) => p.id === state.activePersonaId) ?? null,
  );
}
