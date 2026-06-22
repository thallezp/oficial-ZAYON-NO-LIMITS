"use client";

import * as React from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonalFinance } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowLeftRight, PiggyBank, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { brl, num, currentMonthKey } from "@/lib/utils/life";

export default function MoneyDashboardPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const accounts: any[] = data?.accounts ?? [];
  const categories: any[] = data?.categories ?? [];
  const transactions: any[] = data?.transactions ?? [];

  const month = currentMonthKey();
  const monthTx = transactions.filter((t) => String(t.occurredAt).startsWith(month));
  const income = monthTx.filter((t) => t.type === "income").reduce((a, t) => a + num(t.amount), 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((a, t) => a + num(t.amount), 0);
  const totalBalance = accounts.filter((a) => !a.archived).reduce((a, acc) => a + num(acc.balance), 0);
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro Pessoal"
        description="Seu dinheiro pessoal num só lugar: saldo, fluxo do mês, contas e metas."
        actions={
          <Button variant="gradient" size="sm" asChild>
            <Link href="/money/transactions">
              <ArrowLeftRight className="h-4 w-4" /> Nova transação
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo total" value={brl(totalBalance)} accent="primary" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Entradas (mês)" value={brl(income)} accent="success" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Saídas (mês)" value={brl(expense)} accent="danger" icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Resultado (mês)" value={brl(income - expense)} accent={income - expense >= 0 ? "success" : "danger"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Contas */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Contas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/money/transactions">Gerenciar</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {accounts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma conta. Crie a primeira em Transações.
              </p>
            ) : (
              accounts.filter((a) => !a.archived).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color || "#6366f1" }} />
                    {a.name}
                  </span>
                  <b className="num">{brl(num(a.balance))}</b>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Transações recentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Transações recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/money/transactions">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma transação ainda.</p>
            ) : (
              <div className="space-y-1.5">
                {transactions.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-accent/40">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.description || catById.get(t.categoryId)?.name || "Sem descrição"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.occurredAt).toLocaleDateString("pt-BR")}
                        {catById.get(t.categoryId) && ` · ${catById.get(t.categoryId)!.name}`}
                      </p>
                    </div>
                    <b className={t.type === "income" ? "text-success" : "text-destructive"}>
                      {t.type === "income" ? "+" : "−"} {brl(num(t.amount))}
                    </b>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/money/budget", label: "Orçamento", icon: PiggyBank },
          { href: "/money/bills", label: "Contas & Assinaturas", icon: Receipt },
          { href: "/money/goals", label: "Metas", icon: TrendingUp },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Card variant="elevated" className="group transition-all hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/80 text-primary">
                  <l.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{l.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
