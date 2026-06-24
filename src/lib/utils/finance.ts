// Método "Pague-se Primeiro" (AUVP / Raul Sena): 25% investe PRIMEIRO, 75% vive
// nos pilares. Aqui ficam os 5 pilares e a matemática de juros compostos.
import { brl } from "./life";

export type PillarKey =
  | "custo_fixo"
  | "conforto"
  | "metas"
  | "prazeres"
  | "conhecimento";

export const PILLARS: {
  key: PillarKey;
  label: string;
  color: string;
  desc: string;
}[] = [
  { key: "custo_fixo", label: "Custo Fixo", color: "#3b82f6", desc: "Sobrevivência: moradia, contas, alimentação básica." },
  { key: "conforto", label: "Conforto", color: "#06b6d4", desc: "Bem-estar e rotina: saúde, conveniência, faxina." },
  { key: "metas", label: "Metas", color: "#22c55e", desc: "Os 25% que saem primeiro pra investir." },
  { key: "prazeres", label: "Prazeres", color: "#f59e0b", desc: "Estilo de vida: lazer, hobbies, viagens." },
  { key: "conhecimento", label: "Conhecimento", color: "#a855f7", desc: "Livros, cursos, desenvolvimento pessoal." },
];

export const PILLAR_BY_KEY = Object.fromEntries(PILLARS.map((p) => [p.key, p])) as Record<PillarKey, (typeof PILLARS)[number]>;

/** Os 4 pilares de GASTO (75% "Vida"). Metas é o privilegiado (investimento). */
export const SPENDING_PILLARS = PILLARS.filter((p) => p.key !== "metas");

/** Sugestão de divisão dos 75% "Vida" entre os 4 pilares de gasto (editável). */
export const DEFAULT_LIFE_SHARE: Record<Exclude<PillarKey, "metas">, number> = {
  custo_fixo: 0.53,
  conforto: 0.15,
  prazeres: 0.22,
  conhecimento: 0.1,
};

/** Taxa anual (%) → taxa mensal equivalente (decimal). Ex: 9 → ~0.007207. */
export function monthlyRateFromAnnual(annualPct: number): number {
  const a = (Number(annualPct) || 0) / 100;
  return Math.pow(1 + a, 1 / 12) - 1;
}

/**
 * Valor futuro de aportes mensais constantes + saldo inicial.
 * FV = aporte * (((1+i)^n − 1) / i) + principal * (1+i)^n
 * i = taxa mensal (decimal), n = nº de meses.
 */
export function fvFromMonthly(
  aporte: number,
  iMonthly: number,
  nMonths: number,
  principal = 0,
): number {
  if (nMonths <= 0) return principal;
  const growth = Math.pow(1 + iMonthly, nMonths);
  const annuity = iMonthly === 0 ? aporte * nMonths : aporte * ((growth - 1) / iMonthly);
  return principal * growth + annuity;
}

/** Série anual do patrimônio (1 ponto por ano) para o gráfico de projeção. */
export function projectionSeries(opts: {
  monthly: number;
  annualRatePct: number;
  years: number;
  principal?: number;
}): {
  points: { label: string; value: number }[];
  finalValue: number;
  totalContributed: number;
  iMonthly: number;
} {
  const { monthly, annualRatePct, years, principal = 0 } = opts;
  const i = monthlyRateFromAnnual(annualRatePct);
  const points: { label: string; value: number }[] = [];
  for (let y = 0; y <= years; y++) {
    points.push({ label: `${y}a`, value: Math.round(fvFromMonthly(monthly, i, y * 12, principal)) });
  }
  const finalValue = points[points.length - 1]?.value ?? principal;
  const totalContributed = principal + monthly * years * 12;
  return { points, finalValue, totalContributed, iMonthly: i };
}

/**
 * "Efeito dos primeiros anos": se você aportar só nos primeiros `earlyYears` e
 * deixar render sozinho até o fim, quanto isso representa do patrimônio final?
 * Mostra por que aportar cedo e pesado é o que constrói o patrimônio.
 */
export function earlyYearsImpact(opts: {
  monthly: number;
  annualRatePct: number;
  years: number;
  earlyYears: number;
  principal?: number;
}): { pct: number; earlyContribFinalValue: number; finalValue: number } {
  const { monthly, annualRatePct, years, earlyYears, principal = 0 } = opts;
  const i = monthlyRateFromAnnual(annualRatePct);
  const totalMonths = years * 12;
  const earlyMonths = Math.min(earlyYears, years) * 12;
  const balanceAfterEarly = fvFromMonthly(monthly, i, earlyMonths, principal);
  const earlyContribFinalValue = balanceAfterEarly * Math.pow(1 + i, totalMonths - earlyMonths);
  const finalValue = fvFromMonthly(monthly, i, totalMonths, principal);
  const pct = finalValue > 0 ? Math.round((earlyContribFinalValue / finalValue) * 100) : 0;
  return { pct, earlyContribFinalValue, finalValue };
}

// ── Controle por período (Dia / Semana / Mês) ───────────────────────────────
export type Period = "day" | "week" | "month";

export const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
];

/** Intervalo [start, end) do período + rótulo, no fuso local. Semana começa na segunda. */
export function periodRange(period: Period, ref: Date = new Date()) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  let start: Date;
  let end: Date;
  let label: string;
  if (period === "day") {
    start = d;
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    label = ref.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  } else if (period === "week") {
    const dow = d.getDay(); // 0=Dom..6=Sáb
    const diffToMon = dow === 0 ? 6 : dow - 1;
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToMon);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    label = `Semana de ${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    label = ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  return { start, end, label, period };
}

/** True se `occurredAt` (date "YYYY-MM-DD" ou ISO) cai em [range.start, range.end). */
export function inPeriod(occurredAt: string | Date, range: { start: Date; end: Date }): boolean {
  const t =
    typeof occurredAt === "string"
      ? new Date(occurredAt.length <= 10 ? `${occurredAt}T12:00:00` : occurredAt)
      : occurredAt;
  return t >= range.start && t < range.end;
}

/** Fração do mês que o período representa (p/ ratear um teto/meta mensal). */
export function periodFractionOfMonth(period: Period, ref: Date = new Date()): number {
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  if (period === "day") return 1 / daysInMonth;
  if (period === "week") return 7 / daysInMonth;
  return 1;
}

export type SpendingCaps = { day?: number; week?: number; month?: number };

/**
 * Teto efetivo do período: usa o teto específico se definido; senão rateia o
 * teto mensal pela fração do período. Retorna null se não houver teto aplicável.
 */
export function effectiveCap(
  caps: SpendingCaps | undefined | null,
  period: Period,
  ref: Date = new Date(),
): number | null {
  if (!caps) return null;
  const direct = caps[period];
  if (direct != null && Number(direct) > 0) return Number(direct);
  if (caps.month != null && Number(caps.month) > 0) {
    return Number(caps.month) * periodFractionOfMonth(period, ref);
  }
  return null;
}

/** Chave estável do período p/ persistir o controle. month→YYYY-MM, dia/semana→YYYY-MM-DD. */
export function periodKey(period: Period, range: { start: Date }): string {
  const d = range.start;
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return period === "month" ? ymd.slice(0, 7) : ymd;
}

/** Move a data de referência um período pra trás (-1) ou frente (+1). */
export function shiftPeriod(ref: Date, period: Period, dir: -1 | 1): Date {
  const d = new Date(ref);
  if (period === "day") d.setDate(d.getDate() + dir);
  else if (period === "week") d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

/** True se a data de referência cai no período atual (hoje / esta semana / este mês). */
export function isCurrentPeriod(ref: Date, period: Period): boolean {
  return periodRange(period, ref).start.getTime() === periodRange(period, new Date()).start.getTime();
}

export { brl };
