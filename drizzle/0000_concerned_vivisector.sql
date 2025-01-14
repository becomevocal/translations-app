CREATE TABLE IF NOT EXISTS "storeusers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userid" integer NOT NULL,
	"storehash" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"storehash" varchar(10) NOT NULL,
	"accesstoken" text,
	"scope" text,
	"ownerid" integer NOT NULL,
	"accountuuid" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "translation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"job_type" text NOT NULL,
	"file_url" text,
	"channel_id" integer NOT NULL,
	"locale" text NOT NULL,
	"metadata" json,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"userid" integer NOT NULL,
	"email" text NOT NULL,
	"username" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "userid_storeHash_idx" ON "storeusers" USING btree ("userid","storehash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "storehash_idx" ON "stores" USING btree ("storehash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "userid_idx" ON "users" USING btree ("userid");