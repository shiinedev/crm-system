CREATE INDEX "companies_org_created_idx" ON "companies" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "contacts_org_created_idx" ON "contacts" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "deals_org_created_idx" ON "deals" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "deals_org_stage_idx" ON "deals" USING btree ("organization_id","stage_id");--> statement-breakpoint
CREATE INDEX "documents_org_created_idx" ON "documents" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "tasks_org_created_idx" ON "tasks" USING btree ("organization_id","created_at");