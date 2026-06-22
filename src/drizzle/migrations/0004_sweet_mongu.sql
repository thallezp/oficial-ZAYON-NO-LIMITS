ALTER TABLE "study_goals" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "study_objectives" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "study_resources" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "study_tracks" ADD COLUMN "user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_objectives" ADD CONSTRAINT "study_objectives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_resources" ADD CONSTRAINT "study_resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_tracks" ADD CONSTRAINT "study_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_goals_user_idx" ON "study_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_objectives_user_idx" ON "study_objectives" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_resources_user_idx" ON "study_resources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_tracks_user_idx" ON "study_tracks" USING btree ("user_id");