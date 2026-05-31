import { supabaseServer } from "@/lib/supabase/server";

export async function getCurrentUserOrThrow() {

  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Nao autorizado");
  return user;
}

export async function getAllowedWorkspaceIds() {

  const user = await getCurrentUserOrThrow();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.workspace_id as string);
}

export async function assertWorkspaceMember(workspaceId?: string | null) {
  if (!workspaceId) throw new Error("workspaceId e obrigatorio");

  const allowed = await getAllowedWorkspaceIds();
  if (!allowed.includes(workspaceId)) {
    throw new Error("Acesso negado ao workspace");
  }
}

export async function assertPersonaAccess(personaId?: string | null) {
  if (!personaId) throw new Error("personaId e obrigatorio");

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("personas")
    .select("workspace_id")
    .eq("id", personaId)
    .single();

  if (error || !data?.workspace_id) throw new Error("Persona nao encontrada");
  await assertWorkspaceMember(data.workspace_id);
}

export async function assertTaskAccess(taskId?: string | null) {
  if (!taskId) throw new Error("taskId e obrigatorio");

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("tasks")
    .select("workspace_id")
    .eq("id", taskId)
    .single();

  if (error || !data?.workspace_id) throw new Error("Tarefa nao encontrada");
  await assertWorkspaceMember(data.workspace_id);
}

export async function assertEntityWorkspace(workspaceId?: string | null) {
  await assertWorkspaceMember(workspaceId);
}

export function filterAllowedWorkspaces<T extends { workspaceId?: string | null }>(
  items: T[],
  workspaceIds: string[],
) {
  if (workspaceIds.length === 0) return [];
  return items.filter((item) => item.workspaceId && workspaceIds.includes(item.workspaceId));
}

export async function firstAllowedWorkspaceId() {
  const ids = await getAllowedWorkspaceIds();
  return ids[0] ?? null;
}

export async function assertAnyWorkspaceAccess(workspaceIds: string[]) {
  const allowed = await getAllowedWorkspaceIds();
  const allowedSet = new Set(allowed);
  const hasAccess = workspaceIds.some((id) => allowedSet.has(id));
  if (!hasAccess) throw new Error("Acesso negado ao workspace");
}

export async function assertWorkspaceIdsAccess(workspaceIds: string[]) {
  if (workspaceIds.length === 0) return;
  const allowed = await getAllowedWorkspaceIds();
  const allowedSet = new Set(allowed);
  const denied = workspaceIds.filter((id) => !allowedSet.has(id));
  if (denied.length > 0) throw new Error("Acesso negado ao workspace");
}

export async function listAllowedWorkspaceRows() {
  const ids = await getAllowedWorkspaceIds();
  if (ids.length === 0) return [];

  const supabase = supabaseServer();
  const { data, error } = await supabase.from("workspaces").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  return data ?? [];
}
