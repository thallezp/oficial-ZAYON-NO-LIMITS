ALTER TABLE "personal_bills" ADD COLUMN "income_source_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_bills" ADD CONSTRAINT "personal_bills_income_source_id_personal_income_sources_id_fk" FOREIGN KEY ("income_source_id") REFERENCES "public"."personal_income_sources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
