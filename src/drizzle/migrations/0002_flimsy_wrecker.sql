CREATE TABLE IF NOT EXISTS "task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_depends_on_task_id_tasks_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dependencies_task_idx" ON "task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_dependencies_depends_on_idx" ON "task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "task_dependencies_unique_idx" ON "task_dependencies" USING btree ("task_id","depends_on_task_id");