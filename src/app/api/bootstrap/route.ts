import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", authUser.id)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: userError?.message ?? "User profile not found" },
      { status: 400 },
    );
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", authUser.id);

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 400 },
    );
  }

  const workspaceIds = [...new Set((memberships ?? []).map((m) => m.workspace_id))];

  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select("id, name, slug, description, logo_url, owner_id, created_at")
    .in("id", workspaceIds.length > 0 ? workspaceIds : ["00000000-0000-0000-0000-000000000000"]);

  if (workspacesError) {
    return NextResponse.json(
      { error: workspacesError.message },
      { status: 400 },
    );
  }

  const { data: personas, error: personasError } = await supabase
    .from("personas")
    .select(`
      id,
      workspace_id,
      name,
      codename,
      status,
      niche,
      big_idea,
      bio_short,
      objective,
      voice_tone,
      archetype,
      personality,
      visual_style,
      dress_style,
      forbidden_words,
      preferred_words,
      guidelines,
      reference_links
    `)
    .in("workspace_id", workspaceIds.length > 0 ? workspaceIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  if (personasError) {
    return NextResponse.json(
      { error: personasError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url ?? undefined,
      role: user.role,
    },
    workspaces: (workspaces ?? []).map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description ?? undefined,
      logoUrl: workspace.logo_url ?? undefined,
      ownerId: workspace.owner_id,
      createdAt: workspace.created_at,
    })),
    personas: (personas ?? []).map((persona) => ({
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
