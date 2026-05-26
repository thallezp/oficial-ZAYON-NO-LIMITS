"use server";

/**
 * Server Actions / mutations.
 *
 * Por hora apenas devolvem o input — pluga em Supabase/Drizzle quando
 * subir o backend. Cada mutation deve:
 *   1. validar com schema Zod
 *   2. checar permissão via Supabase Auth + RLS
 *   3. registrar activity_log
 *   4. revalidar cache (revalidatePath / revalidateTag)
 */

import { revalidatePath } from "next/cache";
import {
  taskSchema,
  contentSchema,
  leadSchema,
  financialSchema,
  personaSchema,
} from "@/lib/validations";

export async function createTask(input: unknown) {
  const data = taskSchema.parse(input);
  revalidatePath("/tasks");
  return { ok: true, data };
}

export async function createContent(input: unknown) {
  const data = contentSchema.parse(input);
  revalidatePath(`/personas/${data?.["personaId" as never] ?? ""}/content`);
  return { ok: true, data };
}

export async function createLead(input: unknown) {
  const data = leadSchema.parse(input);
  return { ok: true, data };
}

export async function createFinancial(input: unknown) {
  const data = financialSchema.parse(input);
  return { ok: true, data };
}

export async function upsertPersona(input: unknown) {
  const data = personaSchema.parse(input);
  revalidatePath("/personas");
  return { ok: true, data };
}
