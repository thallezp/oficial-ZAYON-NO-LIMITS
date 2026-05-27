/**
 * Cliente HTTP para mutações via /api/mutate.
 * Evita o problema de cookies() sendo chamado fora de contexto em Server Actions.
 */

export async function callMutate<T = any>(
  action: string,
  payload?: any,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const res = await fetch("/api/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.error || "Erro ao executar ação");
  }

  return json;
}
