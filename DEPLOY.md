# Deploy do NEXUS Workspace OS

Dois caminhos: **A) Demo Vercel rápido** (15 min, sem backend real) · **B) Produção real** (~2-4h conectando Supabase, queries reais, auth).

---

## A) Deploy demo no Vercel (recomendado primeiro)

O sistema sobe inteiro com mock data. Você consegue ver tudo funcionando, validar UX, mostrar pra equipe — sem precisar de Supabase ainda.

### A.1 — Instalar e testar local

```bash
cd "C:\Users\Malog\Desktop\01- Projetos\Z - NO LIMITS"
pnpm install      # (ou npm install / bun install)
pnpm dev
```

Abrir `http://localhost:3000`. Deve aparecer o dashboard com banner amarelo "Modo demonstração".

Se quebrar no install, rode `npm install --legacy-peer-deps`.

### A.2 — Subir no GitHub

```bash
cd "C:\Users\Malog\Desktop\01- Projetos\Z - NO LIMITS"
git init
git add .
git commit -m "feat: NEXUS Workspace OS initial"
git branch -M main
# crie um repo vazio em github.com/seu-user/nexus-workspace-os
git remote add origin https://github.com/SEU_USER/nexus-workspace-os.git
git push -u origin main
```

### A.3 — Importar no Vercel

1. https://vercel.com/new
2. Importar o repo
3. Framework: **Next.js** (auto-detecta)
4. Em **Environment Variables**, adicionar **só uma**:
   ```
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```
5. Deploy

Em ~2 min você tem a URL `nexus-workspace-os.vercel.app` funcionando completamente em modo demo.

---

## B) Produção real (Supabase + Vercel)

### B.1 — Criar projeto Supabase

1. https://supabase.com/dashboard → **New Project**
2. Nome: `nexus-workspace-os` · senha forte · região São Paulo (`sa-east-1`)
3. Aguardar ~2 min provisionar
4. Em **Settings → API**, copiar:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca expor no client)
5. Em **Settings → Database → Connection String → URI** (com `?pgbouncer=true&connection_limit=1`), copiar → `DATABASE_URL`

### B.2 — Aplicar schemas Drizzle

No seu local:

```bash
# .env.local com DATABASE_URL preenchido
pnpm db:generate       # gera migrations a partir de src/drizzle/schema/*
pnpm db:push           # aplica no Supabase
```

Verificar no Supabase **Table Editor** que apareceram: `users`, `workspaces`, `personas`, `tasks`, `content_items`, `leads`, `financial_transactions`, etc.

### B.3 — Aplicar Row Level Security

No Supabase **SQL Editor**, abrir `src/drizzle/rls.sql`, copiar inteiro, **Run**. Isso cria:
- função `user_workspaces()`
- política `*_workspace_select` em cada tabela operacional
- política `*_workspace_mutate` em cada tabela
- `activity_logs` com delete bloqueado (audit trail imutável)

### B.4 — Configurar Supabase Auth

Em **Authentication → Providers**:
- Habilitar **Email** (sign up restrito a domínios da sua equipe se quiser)
- Em **URL Configuration**, adicionar:
  - Site URL: `https://nexus-workspace-os.vercel.app`
  - Redirect URLs: `https://nexus-workspace-os.vercel.app/**`

Em **Authentication → Email Templates**, customizar para a marca NEXUS (opcional).

### B.5 — Habilitar Realtime

No SQL Editor:

```sql
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table content_items;
alter publication supabase_realtime add table financial_transactions;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table activity_logs;
```

### B.6 — Storage (avatars, materiais)

Em **Storage**, criar buckets:
- `avatars` — público, max 2 MB
- `materials` — privado, max 100 MB
- `documents` — privado, max 20 MB

Adicionar política de cada bucket via SQL ou UI (membros do workspace podem read/write seus arquivos).

### B.7 — Trocar mocks por queries reais

Em `src/server/queries/index.ts`, descomentar os blocos Drizzle:

```ts
// Exemplo: tasks.list
list: async (filter?: ScopeFilter) => {
  if (useMockData) return matchScope(MOCK_TASKS, filter);
  const { db } = await import("@/lib/db");
  const { tasks } = await import("@/drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  return db
    .select()
    .from(tasks)
    .where(
      and(
        filter?.workspaceId ? eq(tasks.workspaceId, filter.workspaceId) : undefined,
        filter?.personaId ? eq(tasks.personaId, filter.personaId) : undefined,
      ),
    );
},
```

Reativar `src/lib/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
export { schema };
```

### B.8 — Ligar Supabase Auth no middleware

Em `src/middleware.ts`, descomentar o bloco `// TODO: ligar Supabase Auth`. O login real precisa de um Server Action que chame `supabase.auth.signInWithPassword()`.

### B.9 — Plugar Vercel AI SDK

```bash
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai
```

Em `src/app/api/ai/route.ts`, trocar o stub por:

```ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  const { messages, context } = await req.json();
  const result = await streamText({
    model: anthropic("claude-opus-4-7"),
    system: `Você é o assistente NEXUS. Contexto: ${JSON.stringify(context)}`,
    messages,
  });
  return result.toDataStreamResponse();
}
```

### B.10 — Variáveis de ambiente no Vercel

Vercel → seu projeto → **Settings → Environment Variables**. Adicionar (todas marcadas para Production + Preview):

| Var                                  | Valor                                              |
|--------------------------------------|----------------------------------------------------|
| `NEXT_PUBLIC_USE_MOCK_DATA`          | `false`                                            |
| `NEXT_PUBLIC_SUPABASE_URL`           | (do passo B.1)                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | (do passo B.1)                                     |
| `SUPABASE_SERVICE_ROLE_KEY`          | (do passo B.1)                                     |
| `DATABASE_URL`                       | (do passo B.1)                                     |
| `ANTHROPIC_API_KEY`                  | console.anthropic.com → API keys                   |
| `OPENAI_API_KEY`                     | (opcional, se usar GPT)                            |
| `RESEND_API_KEY`                     | resend.com (para emails de convite)                |
| `UPLOADTHING_SECRET`                 | uploadthing.com                                    |
| `UPLOADTHING_APP_ID`                 | uploadthing.com                                    |
| `LIVEBLOCKS_SECRET_KEY`              | liveblocks.io (colab em docs)                      |

Re-deploy.

### B.11 — Webhook de leads (Google Sheets / Typeform)

URL para configurar no Apps Script ou Zapier:
```
POST https://nexus-workspace-os.vercel.app/api/webhooks/leads
Content-Type: application/json

{
  "source": "Google Sheets",
  "campaign": "Pré-lançamento Aurora",
  "personaId": "p_aurora",
  "name": "Helena Pires",
  "email": "helena@gmail.com",
  "phone": "+5511...",
  "answers": [
    {"question": "Maior desafio?", "answer": "..."}
  ],
  "secret": "ALGUM_SEGREDO_VALIDADO"
}
```

---

## Checklist de release

- [ ] `pnpm install` passa local
- [ ] `pnpm build` passa local sem erros TS
- [ ] Repo no GitHub
- [ ] Projeto criado no Vercel (demo com `NEXT_PUBLIC_USE_MOCK_DATA=true`)
- [ ] Projeto Supabase criado
- [ ] Schemas Drizzle migrados
- [ ] RLS aplicado
- [ ] Auth providers configurados
- [ ] Buckets de Storage criados
- [ ] Realtime habilitado em 6 tabelas
- [ ] Queries em `src/server/queries` apontando pro banco real
- [ ] Middleware com Supabase Auth ativo
- [ ] Endpoint `/api/ai` com Vercel AI SDK + chave
- [ ] Env vars no Vercel
- [ ] Webhook de leads testado
- [ ] Login real funcionando
- [ ] Convidar primeiro membro pelo `/settings/workspace`

---

## Comandos úteis

```bash
pnpm dev                # rodar local
pnpm build              # validar build antes do deploy
pnpm db:generate        # gerar migration nova
pnpm db:push            # aplicar no banco
pnpm db:studio          # abrir Drizzle Studio (UI tipo Table Plus)
pnpm lint               # validar lint
```

## Suporte

Caminho A leva ~15 min. Caminho B leva 2-4h dependendo de quantos integrations você ativa de uma vez. **Recomendo fazer A primeiro** para validar que tudo construiu certo, depois evoluir B módulo a módulo (Auth → Tasks reais → Leads → Finance → AI).
