CREATE TABLE IF NOT EXISTS "energy_daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"sexual_energy" integer,
	"retained" boolean,
	"libido" integer,
	"sleep_hours" numeric(4, 1),
	"sleep_quality" integer,
	"bedtime" text,
	"wake_time" text,
	"diet_quality" integer,
	"water_ml" integer,
	"meals" integer,
	"fasting" boolean,
	"mood" integer,
	"energy_level" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "energy_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'checking',
	"balance" numeric(14, 2) DEFAULT '0',
	"currency" text DEFAULT 'BRL',
	"color" text,
	"icon" text,
	"archived" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"due_day" integer,
	"recurrence" text DEFAULT 'monthly',
	"category" text,
	"status" text DEFAULT 'pending',
	"autopay" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'expense',
	"color" text,
	"icon" text,
	"monthly_budget" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_amount" numeric(14, 2) NOT NULL,
	"current_amount" numeric(14, 2) DEFAULT '0',
	"due_date" date,
	"color" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"category_id" uuid,
	"type" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text,
	"occurred_at" date NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "porn_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trigger" text,
	"intensity" integer,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_daily_logs" ADD CONSTRAINT "energy_daily_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_daily_logs" ADD CONSTRAINT "energy_daily_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_settings" ADD CONSTRAINT "energy_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "energy_settings" ADD CONSTRAINT "energy_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_accounts" ADD CONSTRAINT "personal_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_accounts" ADD CONSTRAINT "personal_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_bills" ADD CONSTRAINT "personal_bills_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_bills" ADD CONSTRAINT "personal_bills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_categories" ADD CONSTRAINT "personal_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_categories" ADD CONSTRAINT "personal_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_account_id_personal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."personal_accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_category_id_personal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."personal_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "porn_events" ADD CONSTRAINT "porn_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "porn_events" ADD CONSTRAINT "porn_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "energy_daily_logs_workspace_idx" ON "energy_daily_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "energy_daily_logs_user_date_uq" ON "energy_daily_logs" USING btree ("workspace_id","user_id","log_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "energy_settings_ws_user_uq" ON "energy_settings" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_accounts_workspace_idx" ON "personal_accounts" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_bills_workspace_idx" ON "personal_bills" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_categories_workspace_idx" ON "personal_categories" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_goals_workspace_idx" ON "personal_goals" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_transactions_workspace_idx" ON "personal_transactions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_transactions_user_idx" ON "personal_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "personal_transactions_occurred_idx" ON "personal_transactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "porn_events_workspace_idx" ON "porn_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "porn_events_user_idx" ON "porn_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "porn_events_occurred_idx" ON "porn_events" USING btree ("occurred_at");