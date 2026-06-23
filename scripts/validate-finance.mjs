// Validação da matemática de juros compostos do módulo Finanças.
// Roda com: node scripts/validate-finance.mjs
// Replica a fórmula de src/lib/utils/finance.ts e checa casos conhecidos.

function fvFromMonthly(aporte, i, n, principal = 0) {
  if (n <= 0) return principal;
  const growth = Math.pow(1 + i, n);
  const annuity = i === 0 ? aporte * n : aporte * ((growth - 1) / i);
  return principal * growth + annuity;
}
const monthlyRateFromAnnual = (a) => Math.pow(1 + a / 100, 1 / 12) - 1;

let failed = 0;
function check(name, got, expected, tol) {
  const ok = Math.abs(got - expected) <= tol;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: got ${got.toFixed(2)}, expected ~${expected} (±${tol})`);
  if (!ok) failed++;
}

// 1) Anuidade conhecida: 100/mês, 1% a.m., 12 meses = 100*((1.01^12-1)/0.01)
check("100/mês @1%a.m. x12m", fvFromMonthly(100, 0.01, 12), 1268.25, 0.05);

// 2) Caso do briefing: 1.000/mês, 0,8% a.m., 240 meses (~20 anos)
check("1000/mês @0,8%a.m. x240m", fvFromMonthly(1000, 0.008, 240), 720950, 1500);

// 3) Só saldo inicial rendendo: 1.000 @1% a.m. x12m = 1000*1.01^12
check("principal 1000 @1%a.m. x12m", fvFromMonthly(0, 0.01, 12, 1000), 1126.83, 0.05);

// 4) Taxa anual->mensal: 9% a.a. ~ 0,7207% a.m.
check("9%a.a. -> %a.m.", monthlyRateFromAnnual(9) * 100, 0.7207, 0.0005);

// 5) Aporte zero, n>0, sem principal = 0
check("aporte 0", fvFromMonthly(0, 0.01, 12, 0), 0, 0.0001);

console.log(failed === 0 ? "\n✅ Todos os casos passaram." : `\n❌ ${failed} caso(s) falharam.`);
process.exit(failed === 0 ? 0 : 1);
