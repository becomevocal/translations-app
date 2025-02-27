CREATE TABLE IF NOT EXISTS "translation_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"error_type" text NOT NULL,
	"error_message" text NOT NULL,
	"raw_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
