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

  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (useMock) {
    return { success: true, message: "Convite aceito (modo demonstração)" };
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

export async function createInviteAction(formData: FormData) {
  const email = formData.get("email") as string;
  const role = (formData.get("role") as any) || "editor";
  const workspaceId = formData.get("workspaceId") as string;
  const invitedById = formData.get("invitedById") as string;

  if (!email || !workspaceId) {
    return { error: "Email e Workspace são obrigatórios" };
  }

  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (useMock) {
    return { success: true, token: "mock-token-xyz" };
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

