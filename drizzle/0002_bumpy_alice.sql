ALTER TABLE "translation_jobs" ALTER COLUMN "store_hash" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "translation_jobs" ALTER COLUMN "status" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "translation_jobs" ALTER COLUMN "job_type" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "translation_jobs" ALTER COLUMN "file_url" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "translation_jobs" ALTER COLUMN "locale" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "translation_jobs" ADD COLUMN "resource_type" varchar DEFAULT 'products' NOT NULL;