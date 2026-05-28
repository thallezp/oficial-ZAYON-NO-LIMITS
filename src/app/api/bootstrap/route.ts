import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseServer();

  // getSession() lê do cookie (local, sem round-trip). Confiamos no middleware
  // que já validou via getUser(). Isso elimina ~200-500ms de cold-start.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authUser = session?.user;
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fase 1: users + workspace_members em paralelo (ambos dependem só de authUser.id).
  const [userRes, membershipRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, avatar_url, role, metadata")
      .eq("id", authUser.id)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", authUser.id),
  ]);

  let user = userRes.data;

  // Cria perfil se não existir
  if (!user) {
    const { data: newUser, error: createUserError } = await supabase
      .from("users")
      .upsert({
        id: authUser.id,
        email: authUser.email ?? "",
        full_name: authUser.user_metadata?.full_name ?? authUser.email ?? "Usuário",
        avatar_url: authUser.user_metadata?.avatar_url ?? null,
        role: "admin",
      })
      .select("id, email, full_name, avatar_url, role, metadata")
      .single();

    if (createUserError || !newUser) {
      console.error("[bootstrap] Falha ao criar perfil do usuário:", createUserError);
      return NextResponse.json(
        { error: createUserError?.message ?? "Não foi possível criar perfil" },
        { status: 400 },
      );
    }
    user = newUser;
  }

  if (membershipRes.error) {
    console.error("[bootstrap] Erro ao buscar memberships:", membershipRes.error);
    return NextResponse.json({ error: membershipRes.error.message }, { status: 400 });
  }

  let workspaceIds = [
    ...new Set((membershipRes.data ?? []).map((m) => m.workspace_id)),
  ];

  // Auto-cria workspace se não existir nenhum
  if (workspaceIds.length === 0) {
    const { data: newWorkspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({
        name: "Zayon No Limits",
        slug: `workspace-${authUser.id.slice(0, 8)}`,
        owner_id: authUser.id,
      })
      .select("id")
      .single();

    if (!wsError && newWorkspace) {
      await supabase.from("workspace_members").insert({
        workspace_id: newWorkspace.id,
        user_id: authUser.id,
        role: "admin",
      });
      workspaceIds = [newWorkspace.id];
    } else {
      console.warn("[bootstrap] Não foi possível criar workspace automático:", wsError);
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url ?? undefined,
          role: user.role,
          metadata: user.metadata ?? {},
        },
        workspaces: [],
        personas: [],
      });
    }
  }

  // Fase 2: workspaces + personas em paralelo.
  const [workspacesRes, personasRes] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, name, slug, description, logo_url, owner_id, created_at")
      .in("id", workspaceIds),
    supabase
      .from("personas")
      .select(
        `id, workspace_id, name, codename, status, niche, big_idea, bio_short,
         objective, voice_tone, archetype, personality, visual_style, dress_style,
         forbidden_words, preferred_words, guidelines, reference_links`,
      )
      .in("workspace_id", workspaceIds)
      .order("name"),
  ]);

  if (workspacesRes.error) {
    return NextResponse.json({ error: workspacesRes.error.message }, { status: 400 });
  }
  if (personasRes.error) {
    return NextResponse.json({ error: personasRes.error.message }, { status: 400 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url ?? undefined,
      role: user.role,
      metadata: (user as any).metadata ?? {},
    },
    workspaces: (workspacesRes.data ?? []).map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description ?? undefined,
      logoUrl: workspace.logo_url ?? undefined,
      ownerId: workspace.owner_id,
      createdAt: workspace.created_at,
    })),
    personas: (personasRes.data ?? []).map((persona) => ({
      id: persona.id,
      workspaceId: persona.workspace_id,
      name: persona.name,
      codename: persona.codename ?? undefined,
      status: persona.status,
      niche: persona.niche ?? undefined,
      bigIdea: persona.big_idea ?? undefined,
      bioShort: persona.bio_short ?? undefined,
      objective: persona.objective ?? undefined,
      voiceTone: persona.voice_tone ?? undefined,
      archetype: persona.archetype ?? undefined,
      personality: (persona.personality as string[] | null) ?? undefined,
      visualStyle: persona.visual_style ?? undefined,
      dressStyle: persona.dress_style ?? undefined,
      forbiddenWords: (persona.forbidden_words as string[] | null) ?? undefined,
      preferredWords: (persona.preferred_words as string[] | null) ?? undefined,
      guidelines: persona.guidelines ?? undefined,
      accent:
        typeof persona.reference_links === "object" &&
        persona.reference_links !== null &&
        "accent" in persona.reference_links
          ? String((persona.reference_links as Record<string, unknown>).accent)
          : undefined,
    })),
  });
}
