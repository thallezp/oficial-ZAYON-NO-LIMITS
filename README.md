# ZAYON No Limits

Plataforma operacional interna premium. Workspace + Persona Ops em um único sistema.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · shadcn-style primitives · Supabase · Drizzle · TanStack Query/Table · Zustand · ECharts · FullCalendar · React Flow · Tiptap · Dnd Kit · Motion · CMDK · Vercel AI SDK · Sonner · Lucide · Simple Icons.

## Camadas

- **Workspace Global** — equipe, projetos, tarefas, documentos, materiais, flows, tools hub, IA.
- **Persona Ops** — cada persona é uma unidade de negócio (identidade, content studio, funil, finance, lançamento, leads, métricas).

## Início rápido

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

O sistema usa exclusivamente dados reais do Supabase — preencha as variáveis do `.env.local` antes de subir.

## Arquitetura de dados

Multi-workspace, multi-persona. Toda tabela operacional tem `workspace_id`. Recursos contextuais de persona têm `persona_id` (opcional para recursos globais).

Ver `src/drizzle/schema/` para o modelo completo.

## Layout

- `src/app/(auth)` — login
- `src/app/(workspace)` — shell autenticada
  - rotas de workspace (dashboard, tasks, …)
  - `personas/[personaId]/*` — operação por persona
- `src/components` — primitives, layout, módulos
- `src/stores` — estado global Zustand
- `src/drizzle/schema` — modelo
