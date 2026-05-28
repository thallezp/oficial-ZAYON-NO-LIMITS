import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton do cliente Supabase no browser.
 *
 * Sem isso, cada chamada `supabaseBrowser()` cria uma nova instância +
 * abre um WebSocket separado pro Realtime. Páginas que chamam
 * `useRealtimeXxx` em sequência acumulam dezenas de sockets, travando
 * o browser.
 */
let cachedClient: SupabaseClient | null = null;

export const supabaseBrowser = (): SupabaseClient => {
  if (cachedClient) return cachedClient;

  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return cachedClient;
};
