/**
 * Camada de queries — server-side data access.
 *
 * Comportamento:
 *   - `useMockData = true` (default sem Supabase) → devolve mocks de `@/data`
 *   - `useMockData = false` → usa Drizzle/Supabase real
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
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as s from "@/drizzle/schema";

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
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.tasks.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.tasks.personaId, filter.personaId));
      return db.select().from(s.tasks).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  content: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_CONTENT, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.contentItems.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.contentItems.personaId, filter.personaId));
      return db.select().from(s.contentItems).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  leads: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_LEADS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.leads.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.leads.personaId, filter.personaId));
      return db.select().from(s.leads).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  finance: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_FINANCE, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.financialTransactions.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.financialTransactions.personaId, filter.personaId));
      return db.select().from(s.financialTransactions).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  personas: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_PERSONAS.filter(
          (p) => !workspaceId || p.workspaceId === workspaceId,
        );
      if (!workspaceId) return db.select().from(s.personas);
      return db.select().from(s.personas).where(eq(s.personas.workspaceId, workspaceId));
    },
    byId: async (id: string) => {
      if (useMockData) return MOCK_PERSONAS.find((p) => p.id === id);
      const rows = await db.select().from(s.personas).where(eq(s.personas.id, id));
      return rows[0] || null;
    },
  },
  documents: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_DOCUMENTS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.documents.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.documents.personaId, filter.personaId));
      return db.select().from(s.documents).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  materials: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_MATERIALS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.materials.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.materials.personaId, filter.personaId));
      return db.select().from(s.materials).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  tools: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_TOOLS.filter(
          (t) => !workspaceId || t.workspaceId === workspaceId,
        );
      if (!workspaceId) return db.select().from(s.tools);
      return db.select().from(s.tools).where(eq(s.tools.workspaceId, workspaceId));
    },
  },
  flows: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_FLOWS.filter(
          (f) => !workspaceId || f.workspaceId === workspaceId,
        );
      if (!workspaceId) return db.select().from(s.flows);
      return db.select().from(s.flows).where(eq(s.flows.workspaceId, workspaceId));
    },
  },
  icpPains: {
    list: async (personaId: string) => {
      if (useMockData) return MOCK_ICP_PAINS.filter((p) => p.personaId === personaId);
      return db.select().from(s.icpPains).where(eq(s.icpPains.personaId, personaId));
    },
  },
  prompts: {
    list: async (personaId: string) => {
      if (useMockData) return MOCK_PROMPT_CHAINS.filter((p) => p.personaId === personaId);
      return db.select().from(s.promptChains).where(eq(s.promptChains.personaId, personaId));
    },
  },
  modeling: {
    list: async (personaId: string) => {
      if (useMockData) return MOCK_MODELING.filter((m) => m.personaId === personaId);
      return db.select().from(s.modelingProfiles).where(eq(s.modelingProfiles.personaId, personaId));
    },
  },
};

