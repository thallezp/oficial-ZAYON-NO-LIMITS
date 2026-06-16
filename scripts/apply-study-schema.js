/**
 * Apply study schema to database.
 * Creates enums, tables, foreign keys, indexes, and RLS policies for the study module.
 * Safe to run multiple times (all statements use IF NOT EXISTS / DO $$ exception handling).
 * 
 * Usage: node scripts/apply-study-schema.js
 */
const postgres = require('postgres');

const url = process.env.DATABASE_URL ||
  "postgresql://postgres.autacnfpywmattfyndyt:@Matificante1002@aws-1-us-west-2.pooler.supabase.com:6543/postgres";
const sql = postgres(url, { prepare: false });

async function run() {
  console.log("Creating study enums...");
  
  // 1) Enums
  const enums = [
    `DO $$ BEGIN CREATE TYPE "study_track_status" AS ENUM('planned','active','paused','completed','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "study_item_status" AS ENUM('not_started','in_progress','completed'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "study_resource_type" AS ENUM('book','course','video','article','doc','pdf','other'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "study_resource_status" AS ENUM('backlog','reading','completed','abandoned'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "study_goal_status" AS ENUM('active','achieved','paused','dropped'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "focus_session_type" AS ENUM('study','work','reading','review','deep_work'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "focus_session_status" AS ENUM('planned','active','completed','abandoned'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "study_review_kind" AS ENUM('note','flashcard','attack_note'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  ];

  for (const e of enums) {
    await sql.unsafe(e);
  }
  console.log("  ✓ Enums created");

  // 2) Tables (order matters for FK references)
  console.log("Creating study tables...");
  
  const tables = [
    // study_objectives (root, no FK to other study tables)
    `CREATE TABLE IF NOT EXISTS "study_objectives" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "persona_id" uuid,
      "name" text NOT NULL,
      "description" text,
      "emoji" text,
      "category" text,
      "status" text DEFAULT 'active',
      "deadline" timestamp with time zone,
      "milestones" jsonb,
      "achieved_at" timestamp with time zone,
      "source_id" text,
      "metadata" jsonb,
      "created_by" uuid,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_tracks (references study_objectives)
    `CREATE TABLE IF NOT EXISTS "study_tracks" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "persona_id" uuid,
      "objective_id" uuid,
      "name" text NOT NULL,
      "area" text,
      "description" text,
      "status" "study_track_status" DEFAULT 'active' NOT NULL,
      "mode" text,
      "start_date" timestamp with time zone,
      "target_date" timestamp with time zone,
      "hours_target" integer,
      "color" text,
      "icon" text,
      "source" jsonb,
      "sort_order" integer DEFAULT 0,
      "source_id" text,
      "created_by" uuid,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_modules (references study_tracks)
    `CREATE TABLE IF NOT EXISTS "study_modules" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "track_id" uuid NOT NULL,
      "name" text NOT NULL,
      "status" "study_item_status" DEFAULT 'not_started' NOT NULL,
      "hours_target" integer,
      "position" integer DEFAULT 0,
      "expanded" boolean DEFAULT false,
      "source_id" text,
      "metadata" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_resources (references study_objectives, study_tracks)
    `CREATE TABLE IF NOT EXISTS "study_resources" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "persona_id" uuid,
      "track_id" uuid,
      "objective_id" uuid,
      "title" text NOT NULL,
      "subtitle" text,
      "authors" text,
      "type" "study_resource_type" DEFAULT 'book' NOT NULL,
      "status" "study_resource_status" DEFAULT 'backlog' NOT NULL,
      "area" text,
      "language" text,
      "year" integer,
      "publisher" text,
      "pages" integer,
      "current_page" integer DEFAULT 0,
      "hours_done" integer DEFAULT 0,
      "link" text,
      "isbn" text,
      "edition" text,
      "rating" integer,
      "review" text,
      "recommend" boolean,
      "tags" jsonb,
      "cover_url" text,
      "file_url" text,
      "started_at" timestamp with time zone,
      "completed_at" timestamp with time zone,
      "source_id" text,
      "metadata" jsonb,
      "created_by" uuid,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_module_items (references study_modules, study_resources)
    `CREATE TABLE IF NOT EXISTS "study_module_items" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "module_id" uuid NOT NULL,
      "name" text NOT NULL,
      "status" "study_item_status" DEFAULT 'not_started' NOT NULL,
      "hours" integer DEFAULT 1,
      "position" integer DEFAULT 0,
      "resource_id" uuid,
      "link" text,
      "source_id" text,
      "metadata" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_goals
    `CREATE TABLE IF NOT EXISTS "study_goals" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "persona_id" uuid,
      "track_id" uuid,
      "objective_id" uuid,
      "title" text NOT NULL,
      "metric" text,
      "target" integer,
      "current" integer DEFAULT 0,
      "period" text,
      "status" "study_goal_status" DEFAULT 'active' NOT NULL,
      "start_date" timestamp with time zone,
      "due_date" timestamp with time zone,
      "metadata" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // focus_sessions
    `CREATE TABLE IF NOT EXISTS "focus_sessions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "persona_id" uuid,
      "user_id" uuid NOT NULL,
      "type" "focus_session_type" NOT NULL,
      "status" "focus_session_status" DEFAULT 'active' NOT NULL,
      "track_id" uuid,
      "module_id" uuid,
      "module_item_id" uuid,
      "resource_id" uuid,
      "project_id" uuid,
      "task_id" uuid,
      "label" text,
      "technique" text,
      "planned_minutes" integer,
      "actual_minutes" integer DEFAULT 0,
      "interruptions" integer DEFAULT 0,
      "focus_score" integer,
      "notes" text,
      "started_at" timestamp with time zone,
      "ended_at" timestamp with time zone,
      "metadata" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_reviews
    `CREATE TABLE IF NOT EXISTS "study_reviews" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "track_id" uuid,
      "module_id" uuid,
      "resource_id" uuid,
      "title" text,
      "content" text,
      "kind" "study_review_kind" DEFAULT 'note' NOT NULL,
      "status" text DEFAULT 'due',
      "ease" integer DEFAULT 250,
      "interval_days" integer DEFAULT 0,
      "reps" integer DEFAULT 0,
      "due_at" timestamp with time zone,
      "last_reviewed_at" timestamp with time zone,
      "metadata" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_plans
    `CREATE TABLE IF NOT EXISTS "study_plans" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "kind" text,
      "name" text NOT NULL,
      "schedule" jsonb,
      "active" boolean DEFAULT true,
      "metadata" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_achievements
    `CREATE TABLE IF NOT EXISTS "study_achievements" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "key" text NOT NULL,
      "name" text NOT NULL,
      "description" text,
      "icon" text,
      "tier" text,
      "unlocked_at" timestamp with time zone,
      "progress" jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,

    // study_settings
    `CREATE TABLE IF NOT EXISTS "study_settings" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "workspace_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "data" jsonb DEFAULT '{}'::jsonb,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`,
  ];

  for (const t of tables) {
    await sql.unsafe(t);
  }
  console.log("  ✓ Tables created");

  // 3) Foreign keys
  console.log("Adding foreign keys...");
  
  const fks = [
    // study_objectives
    `DO $$ BEGIN ALTER TABLE "study_objectives" ADD CONSTRAINT "study_objectives_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_objectives" ADD CONSTRAINT "study_objectives_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_objectives" ADD CONSTRAINT "study_objectives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_tracks
    `DO $$ BEGIN ALTER TABLE "study_tracks" ADD CONSTRAINT "study_tracks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_tracks" ADD CONSTRAINT "study_tracks_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_tracks" ADD CONSTRAINT "study_tracks_objective_id_study_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."study_objectives"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_tracks" ADD CONSTRAINT "study_tracks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_modules
    `DO $$ BEGIN ALTER TABLE "study_modules" ADD CONSTRAINT "study_modules_track_id_study_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."study_tracks"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_resources
    `DO $$ BEGIN ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_track_id_study_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."study_tracks"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_objective_id_study_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."study_objectives"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_module_items
    `DO $$ BEGIN ALTER TABLE "study_module_items" ADD CONSTRAINT "study_module_items_module_id_study_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."study_modules"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_module_items" ADD CONSTRAINT "study_module_items_resource_id_study_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."study_resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_goals
    `DO $$ BEGIN ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_track_id_study_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."study_tracks"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_objective_id_study_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."study_objectives"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // focus_sessions
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_track_id_study_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."study_tracks"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_module_id_study_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."study_modules"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_module_item_id_study_module_items_id_fk" FOREIGN KEY ("module_item_id") REFERENCES "public"."study_module_items"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_resource_id_study_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."study_resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_reviews
    `DO $$ BEGIN ALTER TABLE "study_reviews" ADD CONSTRAINT "study_reviews_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_reviews" ADD CONSTRAINT "study_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_reviews" ADD CONSTRAINT "study_reviews_track_id_study_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."study_tracks"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_reviews" ADD CONSTRAINT "study_reviews_module_id_study_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."study_modules"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_reviews" ADD CONSTRAINT "study_reviews_resource_id_study_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."study_resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_plans
    `DO $$ BEGIN ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_achievements
    `DO $$ BEGIN ALTER TABLE "study_achievements" ADD CONSTRAINT "study_achievements_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_achievements" ADD CONSTRAINT "study_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    // study_settings
    `DO $$ BEGIN ALTER TABLE "study_settings" ADD CONSTRAINT "study_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "study_settings" ADD CONSTRAINT "study_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`,
  ];

  for (const fk of fks) {
    await sql.unsafe(fk);
  }
  console.log("  ✓ Foreign keys added");

  // 4) Indexes
  console.log("Creating indexes...");
  
  const indexes = [
    `CREATE INDEX IF NOT EXISTS "focus_sessions_workspace_idx" ON "focus_sessions" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "focus_sessions_user_idx" ON "focus_sessions" USING btree ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "focus_sessions_type_idx" ON "focus_sessions" USING btree ("type")`,
    `CREATE INDEX IF NOT EXISTS "focus_sessions_started_idx" ON "focus_sessions" USING btree ("started_at")`,
    `CREATE INDEX IF NOT EXISTS "study_achievements_workspace_idx" ON "study_achievements" USING btree ("workspace_id")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "study_achievements_ws_user_key_uq" ON "study_achievements" USING btree ("workspace_id","user_id","key")`,
    `CREATE INDEX IF NOT EXISTS "study_goals_workspace_idx" ON "study_goals" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "study_module_items_module_idx" ON "study_module_items" USING btree ("module_id")`,
    `CREATE INDEX IF NOT EXISTS "study_modules_track_idx" ON "study_modules" USING btree ("track_id")`,
    `CREATE INDEX IF NOT EXISTS "study_objectives_workspace_idx" ON "study_objectives" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "study_plans_workspace_idx" ON "study_plans" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "study_resources_workspace_idx" ON "study_resources" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "study_resources_status_idx" ON "study_resources" USING btree ("status")`,
    `CREATE INDEX IF NOT EXISTS "study_resources_track_idx" ON "study_resources" USING btree ("track_id")`,
    `CREATE INDEX IF NOT EXISTS "study_reviews_workspace_idx" ON "study_reviews" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "study_reviews_user_idx" ON "study_reviews" USING btree ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "study_reviews_due_idx" ON "study_reviews" USING btree ("due_at")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "study_settings_ws_user_uq" ON "study_settings" USING btree ("workspace_id","user_id")`,
    `CREATE INDEX IF NOT EXISTS "study_tracks_workspace_idx" ON "study_tracks" USING btree ("workspace_id")`,
    `CREATE INDEX IF NOT EXISTS "study_tracks_objective_idx" ON "study_tracks" USING btree ("objective_id")`,
  ];

  for (const idx of indexes) {
    await sql.unsafe(idx);
  }
  console.log("  ✓ Indexes created");

  // 5) RLS policies (from 20260615_study_rls.sql)
  console.log("Applying RLS policies...");
  
  const rlsTables = [
    'study_objectives','study_tracks','study_modules','study_module_items',
    'study_resources','study_goals','focus_sessions','study_reviews',
    'study_plans','study_achievements','study_settings'
  ];

  for (const t of rlsTables) {
    await sql.unsafe(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`);
  }

  // Root tables (workspace_id direct)
  const rootRls = [
    'study_objectives','study_tracks','study_resources','study_goals',
    'focus_sessions','study_reviews','study_plans','study_achievements','study_settings'
  ];
  for (const t of rootRls) {
    await sql.unsafe(`DROP POLICY IF EXISTS ${t}_workspace_select ON public.${t}`);
    await sql.unsafe(`DROP POLICY IF EXISTS ${t}_workspace_mutate ON public.${t}`);
    await sql.unsafe(`CREATE POLICY ${t}_workspace_select ON public.${t} FOR SELECT USING (workspace_id IN (SELECT private.user_workspaces()))`);
    await sql.unsafe(`CREATE POLICY ${t}_workspace_mutate ON public.${t} FOR ALL USING (workspace_id IN (SELECT private.user_workspaces())) WITH CHECK (workspace_id IN (SELECT private.user_workspaces()))`);
  }

  // study_modules (child of study_tracks)
  await sql.unsafe(`DROP POLICY IF EXISTS study_modules_workspace_select ON public.study_modules`);
  await sql.unsafe(`DROP POLICY IF EXISTS study_modules_workspace_mutate ON public.study_modules`);
  await sql.unsafe(`CREATE POLICY study_modules_workspace_select ON public.study_modules FOR SELECT USING (EXISTS (SELECT 1 FROM public.study_tracks t WHERE t.id = track_id AND t.workspace_id IN (SELECT private.user_workspaces())))`);
  await sql.unsafe(`CREATE POLICY study_modules_workspace_mutate ON public.study_modules FOR ALL USING (EXISTS (SELECT 1 FROM public.study_tracks t WHERE t.id = track_id AND t.workspace_id IN (SELECT private.user_workspaces()))) WITH CHECK (EXISTS (SELECT 1 FROM public.study_tracks t WHERE t.id = track_id AND t.workspace_id IN (SELECT private.user_workspaces())))`);

  // study_module_items (grandchild: module -> track)
  await sql.unsafe(`DROP POLICY IF EXISTS study_module_items_workspace_select ON public.study_module_items`);
  await sql.unsafe(`DROP POLICY IF EXISTS study_module_items_workspace_mutate ON public.study_module_items`);
  await sql.unsafe(`CREATE POLICY study_module_items_workspace_select ON public.study_module_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.study_modules m JOIN public.study_tracks t ON t.id = m.track_id WHERE m.id = module_id AND t.workspace_id IN (SELECT private.user_workspaces())))`);
  await sql.unsafe(`CREATE POLICY study_module_items_workspace_mutate ON public.study_module_items FOR ALL USING (EXISTS (SELECT 1 FROM public.study_modules m JOIN public.study_tracks t ON t.id = m.track_id WHERE m.id = module_id AND t.workspace_id IN (SELECT private.user_workspaces()))) WITH CHECK (EXISTS (SELECT 1 FROM public.study_modules m JOIN public.study_tracks t ON t.id = m.track_id WHERE m.id = module_id AND t.workspace_id IN (SELECT private.user_workspaces())))`);

  console.log("  ✓ RLS policies applied");

  // 6) Realtime
  console.log("Enabling Realtime...");
  const realtimeTables = ['focus_sessions','study_tracks','study_modules','study_module_items','study_resources','study_reviews'];
  for (const t of realtimeTables) {
    try {
      await sql.unsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${t}`);
    } catch (e) {
      // Already in publication — ignore
    }
  }
  console.log("  ✓ Realtime enabled");

  console.log("\n✅ Study schema applied successfully!");
  await sql.end();
}

run().catch(e => { console.error("FAILED:", e); process.exit(1); });
