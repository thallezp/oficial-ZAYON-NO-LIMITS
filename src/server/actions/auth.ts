"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  const supabase = supabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function logoutAction() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function acceptInviteAction(formData: FormData) {
  const token = formData.get("token") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!token || !name || !password) {
    return { error: "Todos os campos são obrigatórios" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { invitations, workspaceMembers, users } = await import(
      "@/drizzle/schema"
    );
    const { eq, and } = await import("drizzle-orm");

    // Encontra convite
    const invite = await db.query.invitations.findFirst({
      where: and(eq(invitations.token, token), eq(invitations.accepted, false)),
    });

    if (!invite) {
      return { error: "Convite inválido ou já aceito" };
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return { error: "Este convite expirou" };
    }

    // Registra o usuário no Supabase Auth
    const supabase = supabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      // Já existe conta com esse email → orienta a logar em vez de cadastrar.
      if (/already|registered|exists|registrad/i.test(error.message)) {
        return {
          error:
            "Este email já possui uma conta. Faça login para aceitar o convite.",
        };
      }
      return { error: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { error: "Erro ao criar usuário no Supabase Auth" };
    }

    // Garante que o usuário existe na tabela pública
    await db
      .insert(users)
      .values({
        id: userId,
        email: invite.email,
        fullName: name,
        role: "editor",
      })
      .onConflictDoNothing();

    // Adiciona ao workspace
    await db.insert(workspaceMembers).values({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      invitedBy: invite.invitedBy,
    });

    // Marca convite como aceito
    await db
      .update(invitations)
      .set({ accepted: true })
      .where(eq(invitations.id, invite.id));

    // Faz login imediato
    await supabase.auth.signInWithPassword({
      email: invite.email,
      password,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro desconhecido ao aceitar convite" };
  }
}

/**
 * Informações do convite — a página /invite usa para decidir qual fluxo mostrar:
 * - novo usuário (sem conta) → form de cadastro (acceptInviteAction)
 * - usuário existente não logado → pedir login
 * - usuário logado com o email do convite → botão "aceitar"
 * - usuário logado com outro email → pedir para sair
 */
export async function getInviteInfoAction(token: string) {
  if (!token) return { status: "invalid" as const };

  try {
    const { db } = await import("@/lib/db");
    const { invitations, workspaces, users } = await import("@/drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });
    if (!invite) return { status: "invalid" as const };

    const email = invite.email;
    if (invite.accepted) return { status: "accepted" as const, email };
    if (new Date() > new Date(invite.expiresAt)) {
      return { status: "expired" as const, email };
    }

    const [ws, existing] = await Promise.all([
      db.query.workspaces.findFirst({
        where: eq(workspaces.id, invite.workspaceId),
      }),
      db.query.users.findFirst({ where: eq(users.email, email) }),
    ]);

    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      status: "valid" as const,
      email,
      role: invite.role,
      workspaceName: ws?.name ?? "workspace",
      emailHasAccount: !!existing,
      currentUserEmail: user?.email ?? null,
    };
  } catch (err: any) {
    return { status: "error" as const, error: err?.message ?? "Erro" };
  }
}

/**
 * Aceitar convite quando o usuário JÁ está logado (conta existente).
 * Valida que o email logado bate com o do convite e adiciona a membership —
 * sem signup, sem senha nova. Usa Drizzle (ignora RLS) como acceptInviteAction.
 */
export async function acceptInviteAsCurrentUserAction(token: string) {
  if (!token) return { error: "Token ausente" };

  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Faça login para aceitar o convite." };

  try {
    const { db } = await import("@/lib/db");
    const { invitations, workspaceMembers, users } = await import(
      "@/drizzle/schema"
    );
    const { eq, and } = await import("drizzle-orm");

    const invite = await db.query.invitations.findFirst({
      where: and(eq(invitations.token, token), eq(invitations.accepted, false)),
    });
    if (!invite) return { error: "Convite inválido ou já aceito." };
    if (new Date() > new Date(invite.expiresAt)) {
      return { error: "Este convite expirou." };
    }

    if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
      return {
        error: `Este convite é para ${invite.email}. Saia da conta atual (${user.email}) para aceitá-lo.`,
      };
    }

    await db
      .insert(users)
      .values({
        id: user.id,
        email: invite.email,
        fullName:
          (user.user_metadata?.full_name as string | undefined) ?? invite.email,
        role: "editor",
      })
      .onConflictDoNothing();

    // Evita membership duplicada (workspace_members não tem unique em
    // (workspace_id, user_id), então onConflict não bastaria): checa antes.
    const alreadyMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, invite.workspaceId),
        eq(workspaceMembers.userId, user.id),
      ),
    });
    if (!alreadyMember) {
      await db.insert(workspaceMembers).values({
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role,
        invitedBy: invite.invitedBy,
      });
    }

    await db
      .update(invitations)
      .set({ accepted: true })
      .where(eq(invitations.id, invite.id));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro ao aceitar convite" };
  }
}

export async function createInviteAction(formData: FormData) {
  const email = formData.get("email") as string;
  const role = (formData.get("role") as any) || "editor";
  const workspaceId = formData.get("workspaceId") as string;
  const invitedById = formData.get("invitedById") as string;

  if (!email || !workspaceId) {
    return { error: "Email e Workspace são obrigatórios" };
  }


  try {
    const { db } = await import("@/lib/db");
    const { invitations } = await import("@/drizzle/schema");
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await db.insert(invitations).values({
      workspaceId,
      email,
      role,
      token,
      invitedBy: invitedById || null,
      accepted: false,
      expiresAt,
    });

    // Enviar e-mail usando Resend
    try {
      const { sendInviteEmail } = await import("@/lib/email/resend");
      await sendInviteEmail({ email, token, role });
    } catch (emailErr) {
      console.warn("Erro ao enviar e-mail de convite:", emailErr);
    }

    return { success: true, token };
  } catch (err: any) {
    return { error: err.message || "Erro ao processar convite" };
  }
}

