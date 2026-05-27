import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendInviteEmail({
  email,
  token,
  role,
}: {
  email: string;
  token: string;
  role: string;
}) {
  const inviteUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/invite?token=${token}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0d1a; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f2937;">
      <h2 style="color: #3b82f6; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">ZAYON No Limits</h2>
      <p style="font-size: 16px; line-height: 1.5;">Você foi convidado para se juntar ao workspace da equipe como <strong>${role}</strong>.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Aceitar Convite</a>
      </div>
      <p style="font-size: 12px; color: #9ca3af;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${inviteUrl}</p>
      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">Este convite expira em 7 dias.</p>
    </div>
  `;

  if (!resend) {
    console.log("Resend não configurado. Imprimindo e-mail no console:");
    console.log("Para:", email);
    console.log("Assunto: Convite para ZAYON No Limits");
    console.log("Conteúdo:", html);
    return { success: true, mocked: true };
  }

  const { data, error } = await resend.emails.send({
    from: "ZAYON No Limits <onboarding@resend.dev>",
    to: email,
    subject: "Convite para se juntar à equipe no ZAYON HQ",
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, id: data?.id };
}

export async function sendReminderEmail({
  email,
  title,
  body,
}: {
  email: string;
  title: string;
  body: string;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0d1a; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f2937;">
      <h2 style="color: #ef4444; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">Lembrete ZAYON</h2>
      <p style="font-size: 16px; line-height: 1.5; font-weight: bold;">${title}</p>
      <p style="font-size: 14px; line-height: 1.5; color: #d1d5db;">${body}</p>
      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">ZAYON No Limits — Sistema Operacional Interno</p>
    </div>
  `;

  if (!resend) {
    console.log("Resend não configurado. Lembrete impresso:");
    console.log("Para:", email);
    console.log("Assunto:", title);
    console.log("Conteúdo:", html);
    return { success: true, mocked: true };
  }

  const { data, error } = await resend.emails.send({
    from: "ZAYON Lembrete <onboarding@resend.dev>",
    to: email,
    subject: title,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, id: data?.id };
}
