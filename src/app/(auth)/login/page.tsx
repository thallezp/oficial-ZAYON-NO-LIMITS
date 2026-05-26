"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Github, KeyRound, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/60 mesh-bg p-12">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-semibold tracking-tight">NEXUS</div>
            <Badge variant="primary" size="sm">
              Workspace OS
            </Badge>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative space-y-8 max-w-md"
        >
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-balance">
            Tudo da operação em um só lugar.
            <span className="block text-muted-foreground">
              Workspace, personas, conteúdo, leads e finanças.
            </span>
          </h1>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Multi-workspace · multi-persona com isolamento total",
              "Content Studio que unifica Instagram, TikTok e canais",
              "Funil visual, financeiro por persona e CRM de leads",
              "IA contextual com ações reais no sistema",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} NEXUS — sistema interno
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-sm space-y-6 panel-strong p-8"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-muted-foreground">
              Acesse o workspace da sua equipe
            </p>
          </div>

          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@equipe.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>
            <Button variant="gradient" size="lg" className="w-full" asChild>
              <Link href="/dashboard">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </form>

          <div className="relative text-center text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border/60" />
            <span className="relative bg-card px-2">ou continuar com</span>
          </div>

          <Button variant="outline" size="lg" className="w-full">
            <Github className="h-4 w-4" /> SSO da equipe
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Acesso restrito · convide membros em Settings
          </p>
        </motion.div>
      </div>
    </div>
  );
}
