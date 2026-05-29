-- ============================================================
-- NEXUS Workspace OS · Complete Supabase Database Setup DDL
-- ============================================================
-- Execute este script no editor SQL do painel do seu Supabase.
-- Ele cria todas as tabelas operacionais, enums, índices,
-- políticas de RLS e o trigger de sincronização de usuários.
-- ============================================================

-- 1. Criação de Enums Customizados (Tipos)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE public.role AS ENUM ('owner', 'admin', 'editor', 'viewer', 'financeiro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'doing', 'review', 'done');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'persona_status') THEN
        CREATE TYPE public.persona_status AS ENUM ('active', 'building', 'paused', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_channel') THEN
        CREATE TYPE public.content_channel AS ENUM ('instagram', 'tiktok', 'youtube', 'whatsapp', 'email', 'telegram');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE public.content_type AS ENUM ('reel', 'feed', 'carousel', 'story', 'short', 'video', 'post', 'email', 'live', 'ad');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE public.content_status AS ENUM ('idea', 'pending', 'scripted', 'recorded', 'editing', 'scheduled', 'posted', 'analyzed', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_pillar') THEN
        CREATE TYPE public.content_pillar AS ENUM ('attraction', 'educational', 'tips', 'opinion', 'neutral', 'offer', 'authority', 'behind');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE public.lead_status AS ENUM ('open', 'approached', 'qualified', 'converted', 'lost', 'no_response');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_type') THEN
        CREATE TYPE public.financial_type AS ENUM ('revenue', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_status') THEN
        CREATE TYPE public.financial_status AS ENUM ('pending', 'paid', 'overdue', 'canceled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_source') THEN
        CREATE TYPE public.financial_source AS ENUM ('gateway', 'hotmart', 'pix', 'stripe', 'boleto', 'transfer', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_status') THEN
        CREATE TYPE public.prompt_status AS ENUM ('building', 'robust', 'archived');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flow_node_type') THEN
        CREATE TYPE public.flow_node_type AS ENUM ('content', 'direct', 'whatsapp', 'landing', 'checkout', 'email', 'community', 'call', 'webinar', 'live', 'remarketing', 'custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_action_status') THEN
        CREATE TYPE public.ai_action_status AS ENUM ('queued', 'running', 'completed', 'failed');
    END IF;
END $$;

-- 2. Criação das Tabelas

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'editor',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES public.users(id),
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role public.role DEFAULT 'editor'::public.role NOT NULL,
  invited_by UUID REFERENCES public.users(id),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role public.role DEFAULT 'editor'::public.role NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES public.users(id),
  accepted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Roles (Cargos Customizados)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Permissions (Permissões de Cargos)
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID,
  actor_id UUID REFERENCES public.users(id),
  actor_type TEXT DEFAULT 'user',
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comments (Comentários genéricos sobre entidades)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Mentions (Menções @usuario em comentários)
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Presence Sessions (Sessões de presença online)
CREATE TABLE IF NOT EXISTS public.presence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  socket_id TEXT NOT NULL,
  status TEXT NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Personas
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  codename TEXT,
  status public.persona_status DEFAULT 'building'::public.persona_status NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  niche TEXT,
  big_idea TEXT,
  bio_short TEXT,
  objective TEXT,
  voice_tone TEXT,
  archetype TEXT,
  personality JSONB,
  visual_style TEXT,
  dress_style TEXT,
  forbidden_words JSONB,
  preferred_words JSONB,
  reference_links JSONB,
  guidelines TEXT,
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_at TIMESTAMPTZ
);

-- Persona Channels
CREATE TABLE IF NOT EXISTS public.persona_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL,
  handle TEXT,
  url TEXT,
  followers INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Persona Metrics Snapshots
CREATE TABLE IF NOT EXISTS public.persona_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  revenue NUMERIC(14, 2) DEFAULT 0,
  followers INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  engagement NUMERIC(6, 3) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  raw JSONB
);

-- Content Pillars
CREATE TABLE IF NOT EXISTS public.content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  weight INTEGER DEFAULT 1
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  status TEXT DEFAULT 'active',
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  parent_task_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status DEFAULT 'todo'::public.task_status NOT NULL,
  priority public.task_priority DEFAULT 'medium'::public.task_priority NOT NULL,
  assignee_id UUID REFERENCES public.users(id),
  creator_id UUID REFERENCES public.users(id),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  labels JSONB,
  related_entity JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Task Labels
CREATE TABLE IF NOT EXISTS public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Task Comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  color TEXT,
  category TEXT,
  created_by UUID REFERENCES public.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  icon TEXT,
  emoji TEXT,
  summary TEXT,
  content JSONB,
  type TEXT DEFAULT 'doc',
  tags JSONB,
  parent_id UUID,
  author_id UUID REFERENCES public.users(id),
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document Blocks (Editor Notion-like)
CREATE TABLE IF NOT EXISTS public.document_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  block_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content JSONB,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Folders
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  parent_id UUID,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Materials (Files)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  size_bytes INTEGER,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  tags JSONB,
  related_entity JSONB,
  uploaded_by UUID REFERENCES public.users(id),
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Content Items
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  channel public.content_channel NOT NULL,
  content_type public.content_type NOT NULL,
  title TEXT NOT NULL,
  hook TEXT,
  script TEXT,
  caption TEXT,
  visual_brief TEXT,
  audio_reference TEXT,
  reference_links JSONB,
  pillar public.content_pillar,
  status public.content_status DEFAULT 'idea'::public.content_status NOT NULL,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  owner_id UUID REFERENCES public.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Content Comments
CREATE TABLE IF NOT EXISTS public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Content Metrics
CREATE TABLE IF NOT EXISTS public.content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate INTEGER DEFAULT 0,
  retention INTEGER DEFAULT 0,
  raw JSONB
);

-- Content References
CREATE TABLE IF NOT EXISTS public.content_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  url TEXT,
  notes TEXT
);

-- Modeling Profiles
CREATE TABLE IF NOT EXISTS public.modeling_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  social_network TEXT,
  country TEXT,
  link TEXT,
  niche TEXT,
  category TEXT,
  notes TEXT,
  photo_url TEXT,
  tags JSONB,
  refs JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Modeling Content Examples
CREATE TABLE IF NOT EXISTS public.modeling_content_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.modeling_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  channel TEXT,
  analysis TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prompt Chains
CREATE TABLE IF NOT EXISTS public.prompt_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'building',
  base_prompt TEXT,
  chain JSONB,
  tags JSONB,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prompt Iterations
CREATE TABLE IF NOT EXISTS public.prompt_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_chain_id UUID REFERENCES public.prompt_chains(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Flows
CREATE TABLE IF NOT EXISTS public.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'process',
  icon TEXT,
  color TEXT,
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Flow Nodes
CREATE TABLE IF NOT EXISTS public.flow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES public.flows(id) ON DELETE CASCADE NOT NULL,
  node_type public.flow_node_type DEFAULT 'custom'::public.flow_node_type,
  title TEXT,
  description TEXT,
  position JSONB,
  data JSONB
);

-- Flow Edges
CREATE TABLE IF NOT EXISTS public.flow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES public.flows(id) ON DELETE CASCADE NOT NULL,
  source UUID NOT NULL,
  target UUID NOT NULL,
  label TEXT,
  data JSONB
);

-- Sales Funnels
CREATE TABLE IF NOT EXISTS public.sales_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conversion_rate NUMERIC(6, 3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Funnel Nodes
CREATE TABLE IF NOT EXISTS public.funnel_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.sales_funnels(id) ON DELETE CASCADE NOT NULL,
  node_type public.flow_node_type DEFAULT 'custom'::public.flow_node_type,
  title TEXT,
  description TEXT,
  position JSONB,
  data JSONB,
  metrics JSONB
);

-- Funnel Edges
CREATE TABLE IF NOT EXISTS public.funnel_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.sales_funnels(id) ON DELETE CASCADE NOT NULL,
  source UUID NOT NULL,
  target UUID NOT NULL,
  label TEXT,
  data JSONB
);

-- Financial Categories
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  type public.financial_type NOT NULL
);

-- Financial Transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  project_id UUID,
  type public.financial_type NOT NULL,
  status public.financial_status DEFAULT 'pending'::public.financial_status NOT NULL,
  source public.financial_source DEFAULT 'other'::public.financial_source,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  notes TEXT,
  occurred_at DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  category_id UUID REFERENCES public.financial_categories(id),
  receipt_url TEXT,
  metadata JSONB,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Payroll Members
CREATE TABLE IF NOT EXISTS public.payroll_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  base_salary NUMERIC(14, 2) DEFAULT 0,
  commission NUMERIC(14, 2) DEFAULT 0,
  pix_key TEXT,
  pay_day TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Bills
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  due_at DATE NOT NULL,
  recurrence TEXT,
  status public.financial_status DEFAULT 'pending'::public.financial_status,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Lead Sources
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT,
  metadata JSONB
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  source_id UUID REFERENCES public.lead_sources(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  campaign TEXT,
  status public.lead_status DEFAULT 'open'::public.lead_status NOT NULL,
  score INTEGER DEFAULT 0,
  qualified INTEGER DEFAULT 0,
  responsible_id UUID REFERENCES public.users(id),
  notes TEXT,
  metadata JSONB,
  converted_value NUMERIC(14, 2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Lead Answers
CREATE TABLE IF NOT EXISTS public.lead_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Lead Status History
CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  from_status public.lead_status,
  to_status public.lead_status NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Google Sheets Connections
CREATE TABLE IF NOT EXISTS public.google_sheets_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sheet_url TEXT NOT NULL,
  webhook_secret TEXT,
  field_mapping JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tool Categories
CREATE TABLE IF NOT EXISTS public.tool_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  color TEXT
);

-- Tools
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  logo_url TEXT,
  icon_slug TEXT,
  category_id UUID REFERENCES public.tool_categories(id) ON DELETE SET NULL,
  tags JSONB,
  metadata JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_embeddable BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tool Tags
CREATE TABLE IF NOT EXISTS public.tool_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tool Embeds
CREATE TABLE IF NOT EXISTS public.tool_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tool Links
CREATE TABLE IF NOT EXISTS public.tool_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tool Favorites
CREATE TABLE IF NOT EXISTS public.tool_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tool Recents
CREATE TABLE IF NOT EXISTS public.tool_recents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Launch Campaigns
CREATE TABLE IF NOT EXISTS public.launch_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  starts_at DATE,
  ends_at DATE,
  status TEXT DEFAULT 'planning',
  goal TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Launch Events
CREATE TABLE IF NOT EXISTS public.launch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.launch_campaigns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  type TEXT,
  metadata JSONB
);

-- ICP Pains
CREATE TABLE IF NOT EXISTS public.icp_pains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  tags JSONB,
  intensity TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Sales Copies
CREATE TABLE IF NOT EXISTS public.sales_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.launch_campaigns(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  metadata JSONB,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Threads
CREATE TABLE IF NOT EXISTS public.ai_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  model TEXT,
  context_entity JSONB,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.ai_threads(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  attachments JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Actions
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.ai_threads(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  status public.ai_action_status DEFAULT 'queued'::public.ai_action_status NOT NULL,
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Tool Calls (Log de chamadas executadas por agentes)
CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES public.ai_actions(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  args JSONB NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comments (Geral para colaboração)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Mentions
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Presence Sessions (Sockets/Presença)
CREATE TABLE IF NOT EXISTS public.presence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  socket_id TEXT NOT NULL,
  status TEXT NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Índices de Performance
CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_workspace_idx ON public.activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS activity_logs_persona_idx ON public.activity_logs(persona_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS personas_workspace_idx ON public.personas(workspace_id);
CREATE INDEX IF NOT EXISTS personas_status_idx ON public.personas(status);
CREATE INDEX IF NOT EXISTS tasks_workspace_idx ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS tasks_persona_idx ON public.tasks(persona_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS content_items_workspace_idx ON public.content_items(workspace_id);
CREATE INDEX IF NOT EXISTS content_items_persona_idx ON public.content_items(persona_id);
CREATE INDEX IF NOT EXISTS content_items_channel_idx ON public.content_items(channel);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON public.content_items(status);
CREATE INDEX IF NOT EXISTS leads_workspace_idx ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS leads_persona_idx ON public.leads(persona_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS financial_transactions_workspace_idx ON public.financial_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS financial_transactions_persona_idx ON public.financial_transactions(persona_id);
CREATE INDEX IF NOT EXISTS tool_favorites_user_idx ON public.tool_favorites(user_id);
CREATE INDEX IF NOT EXISTS presence_sessions_workspace_idx ON public.presence_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS presence_sessions_user_idx ON public.presence_sessions(user_id);

-- 4. Supabase Row Level Security (RLS)
CREATE SCHEMA IF NOT EXISTS private;

-- Habilitar RLS em todas as tabelas operacionais
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_channels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pillars       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_references    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modeling_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modeling_content_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_chains         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_iterations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_edges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_nodes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_edges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_embeds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_links            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_recents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_pains             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_copies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_threads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_calls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;

-- Helper: retorna a lista de workspaces aos quais o usuário pertence
DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.workspace_members wm_self
        JOIN public.workspace_members wm_target
          ON wm_self.workspace_id = wm_target.workspace_id
       WHERE wm_self.user_id = auth.uid()
         AND wm_target.user_id = users.id
    )
  );

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION private.user_workspaces()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT workspace_id
    FROM public.workspace_members
   WHERE user_id = auth.uid();
$$;

-- Políticas Genéricas baseadas em workspace_id
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'personas','persona_channels','persona_metrics_snapshots','content_pillars',
      'projects','tasks','calendar_events','documents','folders','materials',
      'content_items','modeling_profiles','prompt_chains','flows','sales_funnels',
      'financial_categories','financial_transactions','payroll_members','bills',
      'lead_sources','leads','google_sheets_connections','tool_categories','tools',
      'launch_campaigns','icp_pains','sales_copies','ai_threads','ai_actions',
      'comments','presence_sessions','activity_logs','notifications','roles',
      'invitations'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_workspace_select ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_workspace_mutate ON public.%I;', t, t);

    EXECUTE format(
      'CREATE POLICY %I_workspace_select ON public.%I FOR SELECT USING (workspace_id IN (SELECT private.user_workspaces()));',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_workspace_mutate ON public.%I FOR ALL USING (workspace_id IN (SELECT private.user_workspaces())) WITH CHECK (workspace_id IN (SELECT private.user_workspaces()));',
      t, t
    );
  END LOOP;
END $$;

DO $$
DECLARE policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT *
      FROM (VALUES
        ('task_labels', 'EXISTS (SELECT 1 FROM public.tasks parent WHERE parent.id = task_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('task_comments', 'EXISTS (SELECT 1 FROM public.tasks parent WHERE parent.id = task_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('document_blocks', 'EXISTS (SELECT 1 FROM public.documents parent WHERE parent.id = document_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('content_comments', 'EXISTS (SELECT 1 FROM public.content_items parent WHERE parent.id = content_item_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('content_metrics', 'EXISTS (SELECT 1 FROM public.content_items parent WHERE parent.id = content_item_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('content_references', 'EXISTS (SELECT 1 FROM public.content_items parent WHERE parent.id = content_item_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('modeling_content_examples', 'EXISTS (SELECT 1 FROM public.modeling_profiles parent WHERE parent.id = profile_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('prompt_iterations', 'EXISTS (SELECT 1 FROM public.prompt_chains parent WHERE parent.id = prompt_chain_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('flow_nodes', 'EXISTS (SELECT 1 FROM public.flows parent WHERE parent.id = flow_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('flow_edges', 'EXISTS (SELECT 1 FROM public.flows parent WHERE parent.id = flow_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('funnel_nodes', 'EXISTS (SELECT 1 FROM public.sales_funnels parent WHERE parent.id = funnel_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('funnel_edges', 'EXISTS (SELECT 1 FROM public.sales_funnels parent WHERE parent.id = funnel_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('lead_answers', 'EXISTS (SELECT 1 FROM public.leads parent WHERE parent.id = lead_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('lead_status_history', 'EXISTS (SELECT 1 FROM public.leads parent WHERE parent.id = lead_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('tool_tags', 'EXISTS (SELECT 1 FROM public.tools parent WHERE parent.id = tool_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('tool_embeds', 'EXISTS (SELECT 1 FROM public.tools parent WHERE parent.id = tool_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('tool_links', 'EXISTS (SELECT 1 FROM public.tools parent WHERE parent.id = tool_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('tool_favorites', 'EXISTS (SELECT 1 FROM public.tools parent WHERE parent.id = tool_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('tool_recents', 'EXISTS (SELECT 1 FROM public.tools parent WHERE parent.id = tool_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('launch_events', 'EXISTS (SELECT 1 FROM public.launch_campaigns parent WHERE parent.id = campaign_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('ai_messages', 'EXISTS (SELECT 1 FROM public.ai_threads parent WHERE parent.id = thread_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('ai_tool_calls', 'EXISTS (SELECT 1 FROM public.ai_actions parent WHERE parent.id = action_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('mentions', 'EXISTS (SELECT 1 FROM public.comments parent WHERE parent.id = comment_id AND parent.workspace_id IN (SELECT private.user_workspaces()))'),
        ('permissions', 'EXISTS (SELECT 1 FROM public.roles parent WHERE parent.id = role_id AND parent.workspace_id IN (SELECT private.user_workspaces()))')
      ) AS policies(table_name, predicate_sql)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_workspace_select ON public.%I;', policy_record.table_name, policy_record.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_workspace_mutate ON public.%I;', policy_record.table_name, policy_record.table_name);

    EXECUTE format(
      'CREATE POLICY %I_workspace_select ON public.%I FOR SELECT USING (%s);',
      policy_record.table_name,
      policy_record.table_name,
      policy_record.predicate_sql
    );
    EXECUTE format(
      'CREATE POLICY %I_workspace_mutate ON public.%I FOR ALL USING (%s) WITH CHECK (%s);',
      policy_record.table_name,
      policy_record.table_name,
      policy_record.predicate_sql,
      policy_record.predicate_sql
    );
  END LOOP;
END $$;

-- Workspace members: membros só veem membros do mesmo workspace
DROP POLICY IF EXISTS workspace_members_select ON public.workspace_members;
CREATE POLICY workspace_members_select ON public.workspace_members
  FOR SELECT USING (workspace_id IN (SELECT private.user_workspaces()));

-- Workspaces: usuário só vê os workspaces em que está
DROP POLICY IF EXISTS workspaces_select ON public.workspaces;
CREATE POLICY workspaces_select ON public.workspaces
  FOR SELECT USING (id IN (SELECT private.user_workspaces()));

-- Auditoria: bloquear delete de logs por segurança
DROP POLICY IF EXISTS activity_logs_no_delete ON public.activity_logs;
CREATE POLICY activity_logs_no_delete ON public.activity_logs
  FOR DELETE USING (FALSE);

-- 5. Trigger do Supabase Auth para sincronizar usuários com public.users
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'editor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Associa o trigger ao schema de autenticação do Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- 6. Habilita Realtime do Supabase nas Tabelas Críticas
-- (Necessário adicionar ao canal public_realtime no Supabase Dashboard se preferir, ou usar a sintaxe abaixo)
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.content_items;
alter publication supabase_realtime add table public.financial_transactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.presence_sessions;

-- 7. Expõe tabelas/funções ao Data API explicitamente
-- Importante: desde 28/04/2026 o Supabase pode deixar novas tabelas de public
-- invisíveis para supabase-js/PostgREST sem GRANT explícito.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
grant usage, select on sequences to anon, authenticated, service_role;
