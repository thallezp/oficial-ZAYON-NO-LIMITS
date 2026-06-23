CREATE TABLE IF NOT EXISTS "personal_finance_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"monthly_income" numeric(14, 2) DEFAULT '0',
	"invest_pct" numeric(5, 2) DEFAULT '25',
	"annual_rate" numeric(5, 2) DEFAULT '9',
	"magic_number" numeric(14, 2),
	"currency" text DEFAULT 'BRL',
	"start_date" date,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_categories" ADD COLUMN "pillar" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_finance_profiles" ADD CONSTRAINT "personal_finance_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_finance_profiles" ADD CONSTRAINT "personal_finance_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "personal_finance_profiles_ws_user_uq" ON "personal_finance_profiles" USING btree ("workspace_id","user_id");