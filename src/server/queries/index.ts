/**
 * Camada de queries — server-side data access.
 *
 * Comportamento:
 *   - `useMockData = true` (default sem Supabase) → devolve mocks de `@/data`
 *   - `useMockData = false` → use `db.select(...)` real
 *
 * Cada função abaixo está pronta para receber a query Drizzle. O esqueleto
 * de uma query real está comentado.
 */

import {
  MOCK_TASKS,
  MOCK_CONTENT,
  MOCK_LEADS,
  MOCK_FINANCE,
  MOCK_PERSONAS,
  MOCK_DOCUMENTS,
  MOCK_MATERIALS,
  MOCK_TOOLS,
  MOCK_FLOWS,
  MOCK_ICP_PAINS,
  MOCK_PROMPT_CHAINS,
  MOCK_MODELING,
} from "@/data";
import { useMockData } from "@/lib/config";

interface ScopeFilter {
  workspaceId?: string;
  personaId?: string;
}

function matchScope<T extends ScopeFilter>(items: T[], filter?: ScopeFilter) {
  return items.filter(
    (i) =>
      (!filter?.workspaceId || i.workspaceId === filter.workspaceId) &&
      (!filter?.personaId || i.personaId === filter.personaId),
  );
}

export const queries = {
  tasks: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_TASKS, filter);
      // const rows = await db.select().from(tasks).where(eq(tasks.workspaceId, filter?.workspaceId!));
      // return rows;
      return matchScope(MOCK_TASKS, filter);
    },
  },
  content: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_CONTENT, filter);
      return matchScope(MOCK_CONTENT, filter);
    },
  },
  leads: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_LEADS, filter);
      return matchScope(MOCK_LEADS, filter);
    },
  },
  finance: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_FINANCE, filter);
      return matchScope(MOCK_FINANCE, filter);
    },
  },
  personas: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_PERSONAS.filter(
          (p) => !workspaceId || p.workspaceId === workspaceId,
        );
      return MOCK_PERSONAS.filter(
        (p) => !workspaceId || p.workspaceId === workspaceId,
      );
    },
    byId: async (id: string) => MOCK_PERSONAS.find((p) => p.id === id),
  },
  documents: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_DOCUMENTS, filter);
      return matchScope(MOCK_DOCUMENTS, filter);
    },
  },
  materials: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_MATERIALS, filter);
      return matchScope(MOCK_MATERIALS, filter);
    },
  },
  tools: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_TOOLS.filter(
          (t) => !workspaceId || t.workspaceId === workspaceId,
        );
      return MOCK_TOOLS.filter(
        (t) => !workspaceId || t.workspaceId === workspaceId,
      );
    },
  },
  flows: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_FLOWS.filter(
          (f) => !workspaceId || f.workspaceId === workspaceId,
        );
      return MOCK_FLOWS.filter(
        (f) => !workspaceId || f.workspaceId === workspaceId,
      );
    },
  },
  icpPains: {
    list: async (personaId: string) =>
      MOCK_ICP_PAINS.filter((p) => p.personaId === personaId),
  },
  prompts: {
    list: async (personaId: string) =>
      MOCK_PROMPT_CHAINS.filter((p) => p.personaId === personaId),
  },
  modeling: {
    list: async (personaId: string) =>
      MOCK_MODELING.filter((m) => m.personaId === personaId),
  },
};
