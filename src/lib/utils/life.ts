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

// Marcos de streak (dias) — rótulos próprios, framing motivacional.
export const STREAK_MILESTONES = [
  { days: 1, label: "Primeiro dia", emoji: "🌱" },
  { days: 3, label: "72 horas", emoji: "🔥" },
  { days: 7, label: "1 semana", emoji: "⭐" },
  { days: 14, label: "2 semanas", emoji: "💪" },
  { days: 21, label: "21 dias", emoji: "🧠" },
  { days: 30, label: "1 mês", emoji: "🏅" },
  { days: 45, label: "45 dias", emoji: "⚡" },
  { days: 60, label: "2 meses", emoji: "🚀" },
  { days: 90, label: "Reboot 90 dias", emoji: "👑" },
  { days: 180, label: "6 meses", emoji: "💎" },
  { days: 365, label: "1 ano", emoji: "🏆" },
];

/** Marco anterior/próximo e % de progresso até o próximo. */
export function milestoneProgress(days: number) {
  const next = STREAK_MILESTONES.find((m) => m.days > days) ?? null;
  const reached = STREAK_MILESTONES.filter((m) => m.days <= days);
  const prev = reached[reached.length - 1] ?? null;
  const base = prev?.days ?? 0;
  const target = next?.days ?? base;
  const pct = next ? Math.round(((days - base) / (target - base)) * 100) : 100;
  return { next, prev, reachedCount: reached.length, pct: Math.max(0, Math.min(100, pct)) };
}

// Benefícios percebidos ao longo da reconexão (framing motivacional, não médico).
export const RECOVERY_BENEFITS = [
  { day: 1, text: "Decisão tomada — o cérebro já registra a mudança." },
  { day: 3, text: "A névoa mental começa a baixar; foco voltando." },
  { day: 7, text: "Mais energia e disposição ao longo do dia." },
  { day: 14, text: "Humor mais estável, menos irritação." },
  { day: 30, text: "Autoconfiança e clareza em alta." },
  { day: 60, text: "Motivação e relações mais fortes." },
  { day: 90, text: "Ciclo de reconexão completo — novo padrão consolidado." },
];

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
