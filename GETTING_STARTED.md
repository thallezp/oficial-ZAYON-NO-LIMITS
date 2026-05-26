# NEXUS Workspace OS — começar

Sistema operacional interno premium. Workspace global + Persona Ops.

## Instalação

```bash
# 1. instalar deps
pnpm install       # ou npm install / yarn / bun install

# 2. variáveis (opcional, app sobe sem)
cp .env.example .env.local

# 3. rodar
pnpm dev
```

Acessar `http://localhost:3000`. A raiz redireciona para `/dashboard`. O login mockado fica em `/login`. Sub-rotas auth: `/forgot-password`, `/invite`.

## Atalhos

- `⌘K` / `Ctrl+K` — Command Menu global (busca tudo, executa ações, troca de persona, dispara IA, cria entidades)
- topo direito · botão IA — abre painel lateral **NEXUS AI** contextual
- sidebar · seletor de persona — troca contexto em todas as páginas de Persona Ops
- topo direito · sino — popover de notificações (com unread badge)
- mobile · ícone menu — abre sidebar em drawer

## Estrutura

```
src/
  app/
    (auth)/                · grupo de rotas públicas
      login/
      forgot-password/
      invite/
    (workspace)/           · grupo principal (AppShell)
      dashboard/           · home consolidada da equipe
      tasks/               · kanban (Dnd Kit) + lista + tabela (TanStack) + calendário
      projects/            · cards com progresso
      calendar/            · FullCalendar mês/semana/dia/agenda
      documents/           · grid + editor Tiptap em /documents/[id]
      materials/           · biblioteca com pastas
      flows/               · cards + React Flow em /flows/[id]
      tools/               · Tools Hub estilo Raycast
      team/                · membros e papéis
      ai/                  · Assistant
        actions/           · histórico de ações
        history/           · threads salvas
      personas/            · index com cards
        [personaId]/       · Persona Ops
          overview/        · KPIs e charts ECharts
          look-3d/         · identidade
          content/         · Content Studio unificado
          instagram/       · roteiros + reels + stories
          tiktok/          · slots e métricas
          modeling/        · engenharia reversa
          prompts/         · prompt chains
          funnel/          · React Flow funcional
          finance/         · receita/despesa/folha
          launch/          · cronograma + ICP + copys
          leads/           · CRM com subtabelas expansíveis
      activity/            · audit log
      notifications/
      settings/            · perfil/IA/integrações
        workspace/         · workspace, membros, governança, zona perigosa
        persona/           · gestão de personas
    api/
      ai/                  · Vercel AI SDK endpoint
      webhooks/leads/      · Google Sheets / Typeform ingestion
      exports/leads/       · CSV export

  components/
    ui/                    · primitives (button, card, dialog, dropdown, form, sheet, popover, tabs, accordion, …)
    layout/                · sidebar, topbar, app-shell, switchers, notifications-popover, mobile-sidebar, quick-create-dialog, providers
    command/               · CMDK global
    ai/                    · painel lateral IA
    charts/                · ECharts wrappers (area, bar, pie)
    personas/              · hero + resolver
    tables/                · KanbanBoard (Dnd Kit), DataTable (TanStack), TaskDetailDrawer
    flow/                  · FunnelCanvas + ProcessCanvas (React Flow)
    calendar/              · FullCalendarView wrapper
    editor/                · RichEditor (Tiptap) + EditorToolbar

  stores/                  · Zustand (workspace, persona, ui, quick-create)
  hooks/                   · useDebounce, useShortcut, useMediaQuery, useMounted, useCopyToClipboard
  data/                    · mocks por domínio
  drizzle/
    schema/                · 10 arquivos (core, personas, workspace, content, funnels, finance, leads, tools, launch, ai)
    types.ts               · InferSelect/InferInsert para uso server-side
    rls.sql                · políticas Row Level Security
  lib/
    supabase/              · clients (browser/server)
    db/                    · drizzle bootstrap
    validations/           · zod schemas
    utils/                 · cn, format (currency, compact, percent, relativeTime, initials)
  server/
    queries/               · data access (mockado → trocar por drizzle)
    mutations/             · server actions com revalidatePath
  types/                   · tipos de domínio (achatados para o cliente)
```

## Decisões arquiteturais

- **Multi-workspace, multi-persona**: toda tabela operacional tem `workspace_id`. Recursos contextuais de persona têm `persona_id` (nulável para recursos globais).
- **Conteúdo unificado**: `content_items` centraliza Instagram, TikTok, Stories, YouTube, email, Telegram. Cada tela específica filtra dessa base.
- **Finance único**: `financial_transactions` serve global e por persona via `persona_id`.
- **Tasks polimórficas**: `tasks` carrega `related_entity` (jsonb) com `{type, id, title}` para vincular a documento, lead, conteúdo, lançamento, projeto.
- **Documents/Materials/Flows polimórficos**: cada uma serve global e por persona pelo mesmo schema.
- **IA contextual**: `<AIPanel>` lê a persona ativa via `usePersonaStore` antes de enviar contexto ao endpoint `/api/ai`. Toda ação registra `ai_actions` + `activity_logs`.
- **Mock-first**: `NEXT_PUBLIC_USE_MOCK_DATA=true` permite que o app suba sem Supabase. Trocar `src/server/queries` por `db.select(...)` ao ligar o banco.
- **RLS pronto**: `src/drizzle/rls.sql` aplica políticas de isolamento por workspace.

## Stack viva no projeto

| Camada            | Tech                                                          | Onde |
|-------------------|---------------------------------------------------------------|------|
| Estrutura         | Next.js 15 App Router · TypeScript                            | `src/app/**` |
| Estilo            | Tailwind · design tokens HSL · glassmorphism · mesh-bg        | `src/styles/globals.css` · `tailwind.config.ts` |
| Primitives        | Radix UI (shadcn-style)                                        | `src/components/ui/**` |
| Estado            | Zustand persistido                                            | `src/stores/**` |
| Banco             | Drizzle ORM · Postgres · Supabase                             | `src/drizzle/**` · `src/lib/db` |
| Auth              | Supabase SSR clients                                          | `src/lib/supabase/**` |
| Query/cache       | TanStack Query                                                | `Providers` |
| Tabelas           | TanStack Table                                                | `DataTable` |
| Forms             | React Hook Form + Zod                                          | `src/lib/validations` · `components/ui/form.tsx` |
| Charts            | ECharts                                                       | `src/components/charts/**` |
| Calendário        | FullCalendar                                                  | `components/calendar/full-calendar.tsx` |
| Flow              | React Flow                                                    | `components/flow/{funnel,process}-canvas.tsx` |
| DnD               | Dnd Kit                                                       | `components/tables/kanban-board.tsx` |
| Editor            | Tiptap                                                        | `components/editor/rich-editor.tsx` |
| IA                | Vercel AI SDK (estrutura) · CopilotKit (ações)                | `src/app/api/ai/route.ts` · `components/ai/ai-panel.tsx` |
| Animações         | Motion (Framer)                                               | em todas as páginas |
| Command           | CMDK · ⌘K                                                     | `components/command/command-menu.tsx` |
| Toasts            | Sonner                                                        | `Providers` |
| Ícones            | Lucide · Simple Icons (para logos de ferramentas)             | em todo o app |

## API surfaces

- `POST /api/ai` — Vercel AI SDK entrypoint (validado por Zod)
- `POST /api/webhooks/leads` — ingestão Google Sheets / Typeform
- `GET /api/exports/leads?personaId=…` — exportação CSV

## Para ligar produção

1. Criar projeto Supabase → preencher `.env.local`
2. `pnpm db:generate` + `pnpm db:push` (gera tabelas a partir de `src/drizzle/schema/*`)
3. Rodar `src/drizzle/rls.sql` no SQL Editor do Supabase
4. Trocar mocks em `src/server/queries` por `db.select(...)` real
5. Plugar Vercel AI SDK + CopilotKit em `src/app/api/ai/route.ts`
6. Ativar Realtime nas tabelas: `tasks`, `leads`, `content_items`, `financial_transactions`, `notifications`, `activity_logs`
7. Configurar Liveblocks em `RichEditor` (room por `documentId`)
8. Configurar UploadThing em `MaterialsPage` e `LookPage`

## Loading & resilência

- `loading.tsx` em rotas principais (Skeleton premium com shimmer)
- `error.tsx` no grupo `(workspace)` com botão de retry
- `not-found.tsx` global com command menu hint
- Estados vazios elegantes via `<EmptyState>` em todas as listas
