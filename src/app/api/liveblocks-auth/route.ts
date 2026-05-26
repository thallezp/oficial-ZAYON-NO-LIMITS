import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_prod_mock_key",
});

export async function POST(request: Request) {
  // 1. Obter usuário do Supabase
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bypass em modo desenvolvimento local
  if (!user && process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    const session = liveblocks.prepareSession("mock-user", {
      userInfo: {
        name: "Membro Demo",
        avatar: "https://avatar.vercel.sh/demo",
      },
    });
    session.allow("room:*", session.FULL_ACCESS);
    const { status, body } = await session.authorize();
    return new Response(body, { status });
  }

  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  // 2. Criar sessão do Liveblocks
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.user_metadata?.full_name || user.email || "Membro NEXUS",
      avatar: user.user_metadata?.avatar_url || "",
    },
  });

  // 3. Conceder permissão de acesso à sala (room)
  session.allow("room:*", session.FULL_ACCESS);

  // 4. Autorizar e retornar
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
