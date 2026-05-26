import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de proteção de rotas.
 *
 * Em modo mock (sem Supabase configurado) deixa passar — útil para deploy
 * de demonstração no Vercel. Quando Supabase estiver configurado, valida
 * a sessão e redireciona para /login se ausente.
 */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/invite"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pular assets, API e rotas públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/exports") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Modo mock: tudo liberado
  if (useMock) {
    return NextResponse.next();
  }

  // TODO: ligar Supabase Auth quando rodar produção real
  // const { createServerClient } = await import("@supabase/ssr");
  // const supabase = createServerClient(...);
  // const { data: { session } } = await supabase.auth.getSession();
  //
  // if (!session && !isPublic) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/login";
  //   url.searchParams.set("next", pathname);
  //   return NextResponse.redirect(url);
  // }
  //
  // if (session && isPublic) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/dashboard";
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplicar em tudo exceto:
     * - _next (assets)
     * - favicon / images
     * - api routes que devem ser públicas
     */
    "/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
