// Helpers compartilhados pelas áreas "Gestão de Energia" e "Financeiro Pessoal".

/** Data de hoje em formato YYYY-MM-DD no fuso local (alinha com a coluna `date`). */
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/** Formata número como moeda BRL. */
export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(n) ? n : 0,
  );

/** Converte valor (string numeric do Postgres, null, etc.) para number seguro. */
export const num = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const startOfDayMs = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Diferença em dias inteiros entre duas datas (b - a). */
export const daysBetween = (a: Date, b: Date) =>
  Math.floor((startOfDayMs(b) - startOfDayMs(a)) / 86_400_000);

/** YYYY-MM do mês atual. */
export const currentMonthKey = () => todayISO().slice(0, 7);

/**
 * Streak de "dias limpo" do controle de pornografia: dias desde a última recaída.
 * Se nunca houve recaída, conta desde o primeiro evento registrado.
 */
export function computeCleanStreak(events: Array<{ type: string; occurredAt: string | Date }>) {
  const toDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));
  const relapses = events
    .filter((e) => e.type === "relapse")
    .map((e) => toDate(e.occurredAt))
    .sort((a, b) => b.getTime() - a.getTime());
  const all = events
    .map((e) => toDate(e.occurredAt))
    .sort((a, b) => a.getTime() - b.getTime());

  const lastRelapse = relapses[0] ?? null;
  const since = lastRelapse ?? all[0] ?? null;
  if (!since) return { days: 0, since: null as Date | null, lastRelapse: null as Date | null };

  const days = Math.max(0, daysBetween(since, new Date()));
  return { days, since, lastRelapse };
}

/** Maior sequência de dias limpo no histórico (entre recaídas consecutivas). */
export function computeBestCleanStreak(events: Array<{ type: string; occurredAt: string | Date }>) {
  const toDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));
  const relapses = events
    .filter((e) => e.type === "relapse")
    .map((e) => toDate(e.occurredAt))
    .sort((a, b) => a.getTime() - b.getTime());
  if (relapses.length === 0) return computeCleanStreak(events).days;

  const all = events.map((e) => toDate(e.occurredAt)).sort((a, b) => a.getTime() - b.getTime());
  const start = all[0] ?? relapses[0];
  let best = 0;
  let prev = start;
  for (const r of relapses) {
    best = Math.max(best, daysBetween(prev, r));
    prev = r;
  }
  // trecho aberto entre a última recaída e hoje
  best = Math.max(best, daysBetween(relapses[relapses.length - 1], new Date()));
  return best;
}
