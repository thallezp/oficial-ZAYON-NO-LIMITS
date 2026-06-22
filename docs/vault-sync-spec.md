# Vault Sync Spec — Markdown (Obsidian) → Supabase (ZAYON No Limits)

> Spec gerada por investigação **read-only** do código. Nenhum comportamento do app foi
> alterado. Objetivo: permitir escrever um conversor `markdown → conteúdo do documento`
> 100% fiel ao que este app realmente armazena e renderiza.

## TL;DR (leia isto antes de codar)

1. **O editor é TipTap v2.7.2** (ProseMirror). Não é BlockNote/Editor.js/Lexical.
2. **A fonte da verdade é `documents.content`** — e ela guarda uma **STRING HTML**
   (saída de `editor.getHTML()`), apesar da coluna ser `jsonb`. Em `jsonb`, isso vira
   um *JSON string scalar*.
3. **A tabela `document_blocks` NÃO é usada por nada.** Nenhum `INSERT`, `SELECT` ou
   `UPDATE` em `document_blocks` existe em todo o código do app. Ela é uma tabela
   vestigial/planejada ("Editor Notion-like") que nunca foi ligada. **Não popule ela** —
   não tem efeito no app e o conversor não deve depender dela.
4. Portanto: **seu conversor deve gerar HTML** (subconjunto suportado pelo TipTap abaixo)
   e gravar essa string em `documents.content`. Só isso renderiza no app.

---

## 1. EDITOR

**Biblioteca:** [TipTap](https://tiptap.dev) v2.7.2 (wrapper React sobre ProseMirror).

Dependências relevantes (de [package.json](../package.json)):

```
@tiptap/react            ^2.7.2
@tiptap/starter-kit      ^2.7.2
@tiptap/pm               ^2.7.2   (ProseMirror)
@tiptap/extension-link          ^2.7.2
@tiptap/extension-placeholder   ^2.7.2
@tiptap/extension-task-list     ^2.7.2
@tiptap/extension-task-item     ^2.7.2
```

**Arquivos do componente:**

| Arquivo | Papel |
|---|---|
| [src/components/editor/rich-editor.tsx](../src/components/editor/rich-editor.tsx) | Instancia o editor (`useEditor`), define extensões, lê `initialContent` (HTML) e emite `onChange(html)` via `editor.getHTML()`. |
| [src/components/editor/editor-toolbar.tsx](../src/components/editor/editor-toolbar.tsx) | Toolbar; expõe exatamente os comandos suportados (ver §3). |
| [src/app/(workspace)/documents/[docId]/page.tsx](../src/app/(workspace)/documents/%5BdocId%5D/page.tsx) | Página do documento. Monta `<RichEditor initialContent={typeof doc.content === "string" ? doc.content : ""} onChange={...}>` e faz autosave (debounce 1s) chamando `updateDocumentContent` com a **string HTML**. |

**Configuração exata das extensões** (de `rich-editor.tsx`):

```ts
extensions: [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  Placeholder.configure({ placeholder }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "text-primary underline underline-offset-2" },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
]
```

Consequência crítica para fidelidade: **só existem os nós/marcas do StarterKit + Link +
TaskList/TaskItem.** Não há extensão de **imagem, tabela, callout, underline, cor,
highlight, menção**. Qualquer HTML fora desse schema é **descartado** pelo parser do
ProseMirror ao carregar/editar (ver §3.4).

---

## 2. MODELO DE DADOS (o ponto mais importante)

### 2.1 O que é escrito quando um documento é salvo

Fluxo de escrita (UI → API → DB), confirmado em
[src/app/api/mutate/route.ts](../src/app/api/mutate/route.ts):

- **Criar** (`action: "createDocument"`, linhas ~805-820):
  ```ts
  supabase.from("documents").insert({
    workspace_id: payload.workspaceId,
    persona_id: payload.personaId || null,
    title: payload.title,
    content: payload.content || "",   // <- string HTML (ou "")
    author_id: user.id,
  })
  ```
- **Salvar conteúdo** (`action: "updateDocumentContent"`, linhas ~822-835):
  ```ts
  supabase.from("documents")
    .update({ content, updated_at: new Date().toISOString() /*, title? */ })
    .eq("id", id)
  ```
  Onde `content` é exatamente o `editor.getHTML()` vindo do `onChange` da página.

**Nada é escrito em `document_blocks` nesse fluxo (nem em nenhum outro).**

### 2.2 De onde o app renderiza

Leitura: [src/server/queries/index.ts](../src/server/queries/index.ts) (`documents.byId` /
`documents.list`) faz `db.select().from(documents)` e devolve a linha crua. A página passa
`doc.content` direto para `initialContent` do TipTap. Ou seja:

> **O app renderiza a partir de `documents.content` (string HTML). `document_blocks`
> nunca é lido.**

### 2.3 Sincronizados? Qual é a fonte da verdade?

- Fonte da verdade única: **`documents.content`**.
- `document_blocks`: **não sincronizada, não lida, não escrita.** Tratar como inexistente
  para fins de renderização.

### 2.4 Detalhe de tipo: `jsonb` guardando uma string

A coluna é `content JSONB` (ver [DDL](../supabase_setup.sql) linha 337 e
[migration](../src/drizzle/migrations/0000_flat_killmonger.sql) linha 659), mas o app grava
uma **string**. Em PostgreSQL, uma string é um JSON válido (scalar). Então a célula contém,
por exemplo, o JSON `"<h1>Olá</h1><p>texto</p>"` (com as aspas do JSON). Ao ler de volta via
supabase-js/Drizzle você recebe a string JS `"<h1>Olá</h1><p>texto</p>"` — por isso a página
testa `typeof doc.content === "string"`.

Implicações para o seu writer:
- **Via supabase-js / PostgREST:** passe `content: htmlString` normalmente. O cliente
  serializa para um JSON string scalar automaticamente. ✔️
- **Via SQL cru:** você precisa converter texto → jsonb. Use
  `to_jsonb($1::text)` (recomendado) **ou** `'"...escapado..."'::jsonb`.
  Não faça `content = '<h1>..</h1>'` direto num literal `jsonb` — isso quebra (HTML não é
  JSON válido sem aspas). Exemplo:
  ```sql
  insert into documents (workspace_id, title, content)
  values ($1, $2, to_jsonb($3::text));
  ```
- `content` é **nullable**. `null` → editor abre vazio. `""` também é aceito.

---

## 3. "TIPOS DE BLOCO" = elementos HTML do schema TipTap

⚠️ Como `document_blocks` é inerte, **não existe um catálogo de `document_blocks.type`
definido pelo app** (ver §4). O catálogo real e acionável é o conjunto de **nós/marcas
HTML** que o TipTap deste app entende. É contra isto que você deve converter.

Abaixo, para cada construção: o HTML **canônico que o `getHTML()` emite** (o que você verá
em documentos reais) e, quando útil, a forma mínima que o parser aceita na entrada.

### 3.1 Blocos (nós)

| Markdown | HTML no `documents.content` | Observações |
|---|---|---|
| `# H1` … `###### H6` | `<h1>…</h1>` … `<h6>…</h6>` | Heading do StarterKit aceita níveis **1–6**. ⚠️ Só **H1–H3** têm CSS custom em `rich-editor.tsx` (toolbar só oferece 1–3). H4–H6 renderizam com estilo default do navegador/prose. Recomendo **clampar 4–6 → 3** para fidelidade visual. |
| parágrafo | `<p>texto</p>` | Parágrafo vazio = `<p></p>`. |
| `> citação` | `<blockquote><p>texto</p></blockquote>` | Conteúdo é parágrafo(s) dentro do blockquote. |
| lista com marcador (`- item`) | `<ul><li><p>item</p></li></ul>` | `listItem` envolve o conteúdo em `<p>`. |
| lista numerada (`1. item`) | `<ol><li><p>item</p></li></ol>` | Se começar ≠ 1, sai `<ol start="N">`. |
| checkbox / todo (`- [ ]` / `- [x]`) | `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>…</p></li></ul>` | Ver §3.3 (forma canônica completa). `data-checked="true"` quando marcado. |
| bloco de código (```` ``` ````) | `<pre><code>conteúdo\n</code></pre>` | CodeBlock do StarterKit **não** preserva linguagem por padrão (sem `class="language-x"`). Quebras de linha são literais dentro do `<code>`. |
| divisor (`---`) | `<hr>` | horizontalRule. |
| quebra de linha forçada (duas espaços + enter / `\`) | `<br>` | hardBreak, dentro de um parágrafo. |

Aninhamento: listas podem aninhar (`<ul><li><p>..</p><ul>…</ul></li></ul>`). TaskItem tem
`nested: true`, então sub-tasklists dentro de um taskItem são válidas.

### 3.2 Formatação inline (marcas)

| Markdown | HTML | Marca TipTap |
|---|---|---|
| `**negrito**` | `<strong>negrito</strong>` | bold (parseia também `<b>`, `font-weight`) |
| `*itálico*` / `_itálico_` | `<em>itálico</em>` | italic (parseia também `<i>`) |
| `~~tachado~~` | `<s>tachado</s>` | strike (parseia também `<del>`, `<strike>`) |
| `` `código` `` | `<code>código</code>` | code |
| `[texto](url)` | `<a target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline underline-offset-2" href="url">texto</a>` | link |

Sobre o `<a>`: o app configura `class` custom e `openOnClick:false`; `target`/`rel` são os
defaults da extensão Link. **Para a entrada, o único atributo que importa é `href`** — o
editor reaplica `class`/`rel`/`target` ao re-renderizar. Pode emitir `<a href="url">texto</a>`
que o parser aceita.

Marcas podem combinar: `<strong><em>x</em></strong>`, `<a href><code>x</code></a>`, etc.

### 3.3 Checkbox/Task — forma canônica completa

O que `getHTML()` realmente emite para um item de tarefa (estrutura com `<label>`/`<div>`):

```html
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true">
    <label><input type="checkbox" checked="checked"><span></span></label>
    <div><p>Tarefa concluída</p></div>
  </li>
  <li data-type="taskItem" data-checked="false">
    <label><input type="checkbox"><span></span></label>
    <div><p>Tarefa pendente</p></div>
  </li>
</ul>
```

Forma mínima aceita na entrada (o parser lê `data-checked` e o bloco interno; os wrappers
`<label>/<div>` são reconstruídos no render):

```html
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><p>Tarefa pendente</p></li>
</ul>
```

> Recomendação: para robustez máxima e para que um round-trip (importar → abrir → salvar)
> não mude o HTML, **emita a forma canônica completa**. A forma mínima também funciona.

### 3.4 Sem suporte (degrade obrigatório)

Estes existem em Markdown/Obsidian mas **não têm nó no schema** deste editor. Se você
injetar o HTML correspondente, o ProseMirror **descarta** no parse (não renderiza, e some
no primeiro save):

- **Imagens** `![alt](url)` → não há extensão Image. `<img>` é descartado.
- **Tabelas** GFM → não há extensão Table. `<table>` é descartado.
- **Callouts / admonitions** (`> [!note]`) → vira blockquote comum (perde o tipo).
- **Underline, ==highlight==, sub/sup, cor de texto** → marcas inexistentes, descartadas.
- **Footnotes, math/LaTeX, wikilinks `[[..]]`, embeds `![[..]]`, tags `#tag` inline,
  frontmatter YAML** → sem nó dedicado.

Estratégias de fallback sugeridas (escolha por tipo, no conversor):
- **Imagem:** emitir um link para a URL — `<p><a href="URL">🖼️ alt</a></p>` — assim o
  conteúdo sobrevive a edições. (Inserir `<img>` "real" exigiria adicionar a extensão Image
  no app, o que está **fora de escopo** desta tarefa read-only.)
- **Tabela:** serializar como bloco de código (` ```table ... ``` `) ou como lista; nunca
  como `<table>`.
- **Callout:** `<blockquote><p><strong>Note:</strong> …</p></blockquote>`.
- **Wikilink `[[Página]]`:** resolver para o `documents.id` de destino e emitir
  `<a href="/documents/<id>">Página</a>` (faça num 2º passo, depois de todos os docs
  existirem e você ter o mapa caminho→id). Se não resolver, emitir texto puro.
- **Frontmatter YAML:** não vai pro corpo. Mapeie campos úteis para colunas:
  `title`, `tags` (→ `documents.tags`, ver §5.3), `emoji`/`icon`, etc.

---

## 4. `block_id` e `sort_order`

**Não se aplicam ao app.** Como `document_blocks` nunca é escrita nem lida:

- Não há gerador de `block_id` no código (nem nanoid, nem uuid, nem índice) — porque nada
  cria blocos.
- `sort_order` não tem semântica observável (sem base 0/gaps definidos pelo app).

Para referência, o **schema** da tabela (caso você ainda queira gravar, ciente de que é
inerte) — de [src/drizzle/schema/workspace.ts](../src/drizzle/schema/workspace.ts) linha 194
e [DDL](../supabase_setup.sql) linha 348:

```
document_blocks(
  id          uuid pk default gen_random_uuid(),
  document_id uuid not null  → documents(id) on delete cascade,
  block_id    text not null,        -- formato indefinido pelo app
  type        text not null,        -- valores indefinidos pelo app
  content     jsonb,                -- shape indefinido pelo app
  sort_order  integer not null,     -- semântica indefinida pelo app
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
)
```

> **Recomendação firme:** **não popule `document_blocks`.** Ela só adiciona linhas órfãs
> que o app ignora. Toda a fidelidade vem do HTML em `documents.content`.

---

## 5. Tabela `documents` — inserts, defaults, constraints, RLS

### 5.1 Colunas (DDL real)

De [supabase_setup.sql](../supabase_setup.sql) (l. 329) e
[migration 0000](../src/drizzle/migrations/0000_flat_killmonger.sql) (l. 651). A migration é
a mais completa (inclui `folder_id`, `project_id`, `task_id`, `archived_at`):

```
documents(
  id          uuid pk default gen_random_uuid(),
  workspace_id uuid NOT NULL  → workspaces(id) on delete cascade,
  persona_id  uuid            → personas(id) on delete set null,
  title       text NOT NULL,
  icon        text,
  emoji       text,
  summary     text,
  content     jsonb,                       -- string HTML (ver §2.4)
  type        text DEFAULT 'doc',
  tags        jsonb,                        -- array de strings (ver §5.3)
  parent_id   uuid,                         -- self-ref lógico (sem FK declarada)
  folder_id   uuid,                         -- lógico → folders(id) (sem FK declarada)
  project_id  uuid,
  task_id     uuid,
  author_id   uuid            → users(id),
  is_starred  boolean DEFAULT false,
  archived_at timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
)
```

> Nota: `parent_id`, `folder_id`, `project_id`, `task_id` **não têm FK** no schema Drizzle
> (são `uuid` soltos). Logo, não há validação referencial — mas mantenha consistência por
> conta própria.

### 5.2 Insert mínimo válido

Obrigatórios (NOT NULL sem default): **`workspace_id`** e **`title`**.
Tudo o mais é nullable ou tem default. `workspace_id` precisa apontar para um workspace
existente (FK com cascade).

```jsonc
// mínimo
{ "workspace_id": "<uuid-do-workspace>", "title": "Minha nota" }
```

Defaults aplicados pelo DB: `id` (uuid aleatório — **mas você pode fornecer o seu**, ver
§7.3 idempotência), `type='doc'`, `is_starred=false`, `created_at`/`updated_at`=`now()`.

`author_id` é **nullable** — num sync via service_role sem usuário, pode deixar `null` ou
setar o uuid do dono.

### 5.3 `type` e `tags`

- **`type`**: o app só usa o valor **`"doc"`** (default da coluna; o tool de IA também
  insere `type: "doc"`). Não há enum/constraint — é `text` livre. Use `"doc"`.
- **`tags`**: `jsonb` contendo um **array de strings**. Confirmado pelo uso na UI
  (`doc.tags.map((t: string) => …)`, `bulkTagDocuments` faz merge de arrays de string).
  Exemplo: `["playbook", "vault", "obsidian"]`. Para frontmatter `tags:` do Obsidian,
  mapeie direto para cá (achatando nested tags `a/b` como string `"a/b"` se quiser).
  Via SQL: `tags = $1::jsonb` com `["a","b"]`.

### 5.4 Triggers / RLS / service_role

- **Triggers em `documents`:** **nenhum.** O único trigger do banco é
  `on_auth_user_created` em `auth.users` (sincroniza `public.users`) —
  [supabase_setup.sql](../supabase_setup.sql) l. 1131-1152. **Não há trigger de
  `updated_at`** (o app seta `updated_at` manualmente nas mutations). ⇒ No seu sync,
  **set `updated_at` você mesmo** se quiser refletir a data do arquivo; senão o default
  `now()` no insert basta.
- **RLS:** `documents` tem RLS habilitada com políticas por workspace —
  [rls.sql](../src/drizzle/rls.sql) l. 77 + bloco l. 163-192:
  - `documents_workspace_select` / `documents_workspace_mutate`:
    `workspace_id in (select private.user_workspaces())`.
  - `document_blocks_workspace_*`: via parent (`exists … documents parent where
    parent.id = document_id and parent.workspace_id in user_workspaces()`).
- **Inserts via `service_role`:** o `service_role` do Supabase tem **BYPASSRLS** — as
  políticas acima **não bloqueiam** seu sync. ✔️ (Confirma a observação do seu memory de
  que leituras Drizzle/seed via service role contornam RLS.) Cuidado: justamente por
  contornar RLS, **valide `workspace_id` você mesmo** (nada impede gravar no workspace
  errado).

---

## 6. REUSO — o que já existe no código

Resumo honesto: **não há conversor de Markdown, nem serializador de blocos, nem handler de
colar-para-blocos** que você possa reaproveitar para documentos. O que existe:

| O quê | Onde | Útil? |
|---|---|---|
| `callMutate(action, payload)` — cliente HTTP p/ `/api/mutate` | [src/lib/mutate-client.ts](../src/lib/mutate-client.ts) | É client-side (usa `fetch('/api/mutate')`). Para um sync server-side/script, **não** use; fale direto com Supabase/Drizzle. |
| Handlers `createDocument` / `updateDocumentContent` | [src/app/api/mutate/route.ts](../src/app/api/mutate/route.ts) l. 805-835 | Referência de **como o app grava** (espelhe os campos). Passam `content` como string crua. |
| Validação Zod `createDocument` | [src/lib/validations/mutations.ts](../src/lib/validations/mutations.ts) l. 123-130, 279-281 | `content: z.any().optional()` — confirma que `content` não é validado como estrutura; aceita string. |
| Tool de IA `createDocument` | [src/app/api/ai/route.ts](../src/app/api/ai/route.ts) l. 211-234 | ⚠️ **Inconsistência do app:** o tool insere `content` descrito como *"Conteúdo em markdown ou texto"* **direto**, sem converter para HTML. Como o TipTap parseia HTML (não Markdown), conteúdo gerado pela IA aparece como **texto literal** (um parágrafo com os caracteres `#`, `*` etc. visíveis). **Não copie esse comportamento** — ele é a prova de que o formato fiel é HTML, não Markdown cru. |
| `RichEditor` (TipTap, HTML in/out) | [src/components/editor/rich-editor.tsx](../src/components/editor/rich-editor.tsx) | Define o schema exato (§3). É a referência canônica do que é renderizável. |
| `handlePaste`/`handleDrop` (colar imagem) | [src/components/layout/quick-create-dialog.tsx](../src/components/layout/quick-create-dialog.tsx) l. 332-384 | É para o **textarea de descrição de tarefa** (insere `![imagem](url)` em texto), **não** para o editor de documentos. Não reaproveitável aqui. |

**Conclusão de reuso:** escreva seu próprio `markdown → HTML` (ex.: `markdown-it`/`remark`
no script de sync), restringindo a saída ao subconjunto da §3. Não há helper interno para
isso.

> Opcional (fidelidade máxima de round-trip): você pode gerar o HTML e depois normalizá-lo
> com o próprio TipTap em Node, via `@tiptap/html`’s `generateHTML(json, extensions)` ou
> `generateJSON(html, extensions)` reusando **exatamente** o array de extensões de
> `rich-editor.tsx`. Isso garante que o HTML gravado é idêntico ao que o editor produziria.
> Não é obrigatório — HTML limpo do subconjunto §3 já renderiza corretamente.

---

## 7. EXEMPLOS COMPLETOS

### 7.1 Markdown de origem (exemplo)

```markdown
# Playbook de Lançamento

Resumo com **negrito**, *itálico* e um [link](https://zayon.app).

## Checklist
- [x] Definir oferta
- [ ] Gravar VSL

> Lembrete: validar copy antes de subir.

```ts
const x = 1;
```

---

1. Primeiro
2. Segundo
```

### 7.2 Linha real de `documents` resultante

Valor lógico (como você passaria via supabase-js; `content` é a string HTML):

```json
{
  "id": "8f3a6d2e-1b7c-5e9a-9c44-2a1b3c4d5e6f",
  "workspace_id": "11111111-1111-1111-1111-111111111111",
  "persona_id": null,
  "title": "Playbook de Lançamento",
  "icon": null,
  "emoji": "🚀",
  "summary": null,
  "content": "<h1>Playbook de Lançamento</h1><p>Resumo com <strong>negrito</strong>, <em>itálico</em> e um <a href=\"https://zayon.app\">link</a>.</p><h2>Checklist</h2><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"true\"><p>Definir oferta</p></li><li data-type=\"taskItem\" data-checked=\"false\"><p>Gravar VSL</p></li></ul><blockquote><p>Lembrete: validar copy antes de subir.</p></blockquote><pre><code>const x = 1;\n</code></pre><hr><ol><li><p>Primeiro</p></li><li><p>Segundo</p></li></ol>",
  "type": "doc",
  "tags": ["playbook", "lancamento"],
  "parent_id": null,
  "folder_id": "22222222-2222-2222-2222-222222222222",
  "project_id": null,
  "task_id": null,
  "author_id": null,
  "is_starred": false,
  "archived_at": null
}
```

> Lembre-se (§2.4): no `jsonb`, essa string fica armazenada como JSON string scalar. Via
> supabase-js passe o objeto acima como está. Via SQL, use `to_jsonb($content::text)` e
> `$tags::jsonb`.

O mesmo `content`, formatado para leitura (é exatamente o HTML dentro da string acima):

```html
<h1>Playbook de Lançamento</h1>
<p>Resumo com <strong>negrito</strong>, <em>itálico</em> e um <a href="https://zayon.app">link</a>.</p>
<h2>Checklist</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Definir oferta</p></li>
  <li data-type="taskItem" data-checked="false"><p>Gravar VSL</p></li>
</ul>
<blockquote><p>Lembrete: validar copy antes de subir.</p></blockquote>
<pre><code>const x = 1;
</code></pre>
<hr>
<ol>
  <li><p>Primeiro</p></li>
  <li><p>Segundo</p></li>
</ol>
```

### 7.3 Linhas de `document_blocks` correspondentes

```json
[]
```

**Vazio. De propósito.** O app não escreve nem lê `document_blocks`. Popular essa tabela
não tem efeito na renderização e só cria linhas órfãs. (Ver §4.)

---

## 8. Pastas (`folders`) — para mapear a árvore do vault

O sync também grava pastas. Schema
([src/drizzle/schema/workspace.ts](../src/drizzle/schema/workspace.ts) l. 171):

```
folders(
  id uuid pk default gen_random_uuid(),
  workspace_id uuid NOT NULL → workspaces(id) on delete cascade,
  persona_id uuid → personas(id) on delete set null,
  name text NOT NULL,
  parent_id uuid,              -- self-ref lógico (subpastas); sem FK declarada
  color text,
  drive_url text, drive_provider text,   -- não relevantes p/ vault
  created_at timestamptz default now() not null
)
```

- Mínimo: `workspace_id` + `name`.
- Subpastas: setar `parent_id` para o `id` da pasta-mãe.
- Ligar documento à pasta: `documents.folder_id = folders.id`.
- RLS: mesma política por workspace; **service_role contorna** (§5.4).

---

## 9. Gotchas de um sync de mão única

1. **Idempotência / sem unique constraint.** Nem `documents` nem `folders` têm constraint
   de unicidade por (workspace, nome/caminho). Rodar o sync 2× **duplica tudo** se você
   deixar o DB gerar `id`. **Solução recomendada (alinhada ao seu padrão de seed):** gere o
   `id` de forma **determinística** com **UUID v5** a partir do caminho do arquivo no vault
   (ex.: `uuidv5(workspaceId + ":" + relativePath, NAMESPACE)`) e faça **upsert** por `id`
   (`on conflict (id) do update`). Idem para pastas (a partir do caminho da pasta).
2. **`updated_at` sem trigger.** Defina manualmente se quiser espelhar o mtime do arquivo;
   senão fica `now()` do insert (e não muda em updates a menos que você passe).
3. **`content` é `jsonb`-string.** Não esqueça o `to_jsonb(::text)` no caminho SQL (§2.4).
4. **HTML fora do schema some.** Tudo que não estiver na §3 é descartado pelo ProseMirror.
   Faça o degrade no conversor (§3.4), não confie no editor para preservar.
5. **Markdown cru NÃO renderiza.** Tem que ser HTML. (O tool de IA do app erra nisso — não
   imite.)
6. **`workspace_id` correto.** Como service_role contorna RLS, a validação é sua.
7. **Wikilinks/imagens** precisam de pós-processamento (2º passo com mapa caminho→`id`).

---

### Apêndice — arquivos consultados

- [package.json](../package.json) — versão do TipTap.
- [src/components/editor/rich-editor.tsx](../src/components/editor/rich-editor.tsx) — schema do editor.
- [src/components/editor/editor-toolbar.tsx](../src/components/editor/editor-toolbar.tsx) — comandos suportados.
- [src/app/(workspace)/documents/[docId]/page.tsx](../src/app/(workspace)/documents/%5BdocId%5D/page.tsx) — leitura/escrita de `content` como HTML.
- [src/app/api/mutate/route.ts](../src/app/api/mutate/route.ts) — handlers de documents; ausência de `document_blocks`.
- [src/app/api/ai/route.ts](../src/app/api/ai/route.ts) — tool `createDocument` (inconsistência markdown).
- [src/lib/validations/mutations.ts](../src/lib/validations/mutations.ts) — `content: z.any()`.
- [src/server/queries/index.ts](../src/server/queries/index.ts) — caminho de leitura.
- [src/lib/mutate-client.ts](../src/lib/mutate-client.ts) — cliente de mutações.
- [src/drizzle/schema/workspace.ts](../src/drizzle/schema/workspace.ts) — schemas `documents`/`document_blocks`/`folders`.
- [src/drizzle/rls.sql](../src/drizzle/rls.sql) — RLS de documents/document_blocks.
- [supabase_setup.sql](../supabase_setup.sql) — DDL + triggers.
- [src/drizzle/migrations/0000_flat_killmonger.sql](../src/drizzle/migrations/0000_flat_killmonger.sql) — DDL completo de `documents`.
- Busca global: nenhum `document_blocks`/`documentBlocks` fora de schema/types; nenhum `markdown`/`generateHTML`/`turndown`/`remark`/`handlePaste`(p/ documentos).
