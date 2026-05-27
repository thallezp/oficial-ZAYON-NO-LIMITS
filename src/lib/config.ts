/**
 * Configuração runtime do ZAYON.
 *
 * `useMockData` é true quando:
 *   - `NEXT_PUBLIC_USE_MOCK_DATA=true`, ou
 *   - não há credenciais de Supabase no ambiente.
 *
 * Isso permite que o app suba em qualquer ambiente — local, Vercel preview,
 * Vercel production — mesmo antes do banco estar conectado. Toda query
 * server-side respeita essa flag (ver `src/server/queries`).
 */

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  ai: {
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  },
  uploads: {
    secret: process.env.UPLOADTHING_SECRET,
    appId: process.env.UPLOADTHING_APP_ID,
  },
  email: {
    resendKey: process.env.RESEND_API_KEY,
  },
  liveblocks: {
    secret: process.env.LIVEBLOCKS_SECRET_KEY,
  },
};

export const hasSupabase = Boolean(
  config.supabase.url && config.supabase.publishableKey,
);

export const hasDatabase = Boolean(config.database.url);

export const useMockData =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || !hasSupabase;

export const features = {
  mockData: useMockData,
  supabase: hasSupabase,
  database: hasDatabase,
  ai: Boolean(config.ai.openaiKey || config.ai.anthropicKey),
  uploads: Boolean(config.uploads.secret),
  email: Boolean(config.email.resendKey),
  liveblocks: Boolean(config.liveblocks.secret),
};
