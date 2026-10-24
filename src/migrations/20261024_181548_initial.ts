import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_tenants_role" AS ENUM('administrador', 'comercial');
  CREATE TYPE "public"."enum_contacts_type" AS ENUM('productor', 'acopio', 'cooperativa', 'exportadora', 'industria', 'otro');
  CREATE TYPE "public"."enum_operations_grain" AS ENUM('soja', 'maiz', 'trigo', 'girasol', 'sorgo', 'cebada');
  CREATE TYPE "public"."enum_operations_currency" AS ENUM('USD', 'ARS');
  CREATE TYPE "public"."enum_operations_stage" AS ENUM('concertada', 'confirmada', 'registrada', 'en-entrega', 'entregada', 'precio-fijado', 'liquidada', 'cobrada');
  CREATE TYPE "public"."enum__operations_v_version_grain" AS ENUM('soja', 'maiz', 'trigo', 'girasol', 'sorgo', 'cebada');
  CREATE TYPE "public"."enum__operations_v_version_currency" AS ENUM('USD', 'ARS');
  CREATE TYPE "public"."enum__operations_v_version_stage" AS ENUM('concertada', 'confirmada', 'registrada', 'en-entrega', 'entregada', 'precio-fijado', 'liquidada', 'cobrada');
  CREATE TYPE "public"."enum_price_triggers_side" AS ENUM('venta', 'compra');
  CREATE TYPE "public"."enum_price_triggers_status" AS ENUM('activo', 'alcanzado', 'confirmado', 'cancelado', 'vencido');
  CREATE TYPE "public"."enum__price_triggers_v_version_side" AS ENUM('venta', 'compra');
  CREATE TYPE "public"."enum__price_triggers_v_version_status" AS ENUM('activo', 'alcanzado', 'confirmado', 'cancelado', 'vencido');
  CREATE TYPE "public"."enum_alerts_kind" AS ENUM('cerca', 'alcanzado');
  CREATE TYPE "public"."enum_alerts_resolution" AS ENUM('confirmar', 'actualizar', 'cancelar');
  CREATE TYPE "public"."enum__alerts_v_version_kind" AS ENUM('cerca', 'alcanzado');
  CREATE TYPE "public"."enum__alerts_v_version_resolution" AS ENUM('confirmar', 'actualizar', 'cancelar');
  CREATE TYPE "public"."enum_instruments_grain" AS ENUM('soja', 'maiz', 'trigo', 'girasol', 'sorgo', 'cebada');
  CREATE TYPE "public"."enum_instruments_currency" AS ENUM('USD', 'ARS');
  CREATE TYPE "public"."enum_quotes_source" AS ENUM('remarkets', 'manual');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL,
  	"role" "enum_users_tenants_role" DEFAULT 'comercial' NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"super_admin" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "contacts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"name" varchar NOT NULL,
  	"type" "enum_contacts_type" DEFAULT 'productor' NOT NULL,
  	"cuit" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"locality" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "operations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"seller_id" integer,
  	"buyer_id" integer,
  	"grain" "enum_operations_grain" NOT NULL,
  	"tons" numeric,
  	"price" numeric,
  	"currency" "enum_operations_currency" DEFAULT 'USD',
  	"delivery_conditions" varchar,
  	"a_fijar" boolean DEFAULT false,
  	"stage" "enum_operations_stage" DEFAULT 'concertada' NOT NULL,
  	"responsable_id" integer NOT NULL,
  	"due_date" timestamp(3) with time zone,
  	"price_trigger_id" integer,
  	"updated_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_operations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_seller_id" integer,
  	"version_buyer_id" integer,
  	"version_grain" "enum__operations_v_version_grain" NOT NULL,
  	"version_tons" numeric,
  	"version_price" numeric,
  	"version_currency" "enum__operations_v_version_currency" DEFAULT 'USD',
  	"version_delivery_conditions" varchar,
  	"version_a_fijar" boolean DEFAULT false,
  	"version_stage" "enum__operations_v_version_stage" DEFAULT 'concertada' NOT NULL,
  	"version_responsable_id" integer NOT NULL,
  	"version_due_date" timestamp(3) with time zone,
  	"version_price_trigger_id" integer,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "price_triggers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"contact_id" integer NOT NULL,
  	"instrument_id" integer NOT NULL,
  	"side" "enum_price_triggers_side" DEFAULT 'venta' NOT NULL,
  	"target_price" numeric NOT NULL,
  	"delivery_conditions" varchar,
  	"responsable_id" integer NOT NULL,
  	"valid_until" timestamp(3) with time zone,
  	"status" "enum_price_triggers_status" DEFAULT 'activo' NOT NULL,
  	"activated_at" timestamp(3) with time zone,
  	"cerca_notified_at" timestamp(3) with time zone,
  	"updated_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_price_triggers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_contact_id" integer NOT NULL,
  	"version_instrument_id" integer NOT NULL,
  	"version_side" "enum__price_triggers_v_version_side" DEFAULT 'venta' NOT NULL,
  	"version_target_price" numeric NOT NULL,
  	"version_delivery_conditions" varchar,
  	"version_responsable_id" integer NOT NULL,
  	"version_valid_until" timestamp(3) with time zone,
  	"version_status" "enum__price_triggers_v_version_status" DEFAULT 'activo' NOT NULL,
  	"version_activated_at" timestamp(3) with time zone,
  	"version_cerca_notified_at" timestamp(3) with time zone,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "alerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"price_trigger_id" integer NOT NULL,
  	"quote_id" integer NOT NULL,
  	"kind" "enum_alerts_kind" NOT NULL,
  	"resolution" "enum_alerts_resolution",
  	"new_target_price" numeric,
  	"resolved_by_id" integer,
  	"resolved_at" timestamp(3) with time zone,
  	"operation_id" integer,
  	"updated_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_alerts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_price_trigger_id" integer NOT NULL,
  	"version_quote_id" integer NOT NULL,
  	"version_kind" "enum__alerts_v_version_kind" NOT NULL,
  	"version_resolution" "enum__alerts_v_version_resolution",
  	"version_new_target_price" numeric,
  	"version_resolved_by_id" integer,
  	"version_resolved_at" timestamp(3) with time zone,
  	"version_operation_id" integer,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "instruments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"symbol" varchar NOT NULL,
  	"grain" "enum_instruments_grain",
  	"month" varchar,
  	"currency" "enum_instruments_currency" DEFAULT 'USD',
  	"low_limit_price" numeric,
  	"high_limit_price" numeric,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quotes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"instrument_id" integer NOT NULL,
  	"price" numeric NOT NULL,
  	"size" numeric,
  	"traded_at" timestamp(3) with time zone NOT NULL,
  	"bid" numeric,
  	"offer" numeric,
  	"source" "enum_quotes_source" DEFAULT 'manual' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'contacts' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"collection_slug" varchar DEFAULT 'contacts' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tenants_id" integer,
  	"users_id" integer,
  	"contacts_id" integer,
  	"operations_id" integer,
  	"price_triggers_id" integer,
  	"alerts_id" integer,
  	"instruments_id" integer,
  	"quotes_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feed_status" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"last_success_at" timestamp(3) with time zone,
  	"last_error" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operations" ADD CONSTRAINT "operations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operations" ADD CONSTRAINT "operations_seller_id_contacts_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operations" ADD CONSTRAINT "operations_buyer_id_contacts_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operations" ADD CONSTRAINT "operations_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operations" ADD CONSTRAINT "operations_price_trigger_id_price_triggers_id_fk" FOREIGN KEY ("price_trigger_id") REFERENCES "public"."price_triggers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operations" ADD CONSTRAINT "operations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_parent_id_operations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_version_seller_id_contacts_id_fk" FOREIGN KEY ("version_seller_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_version_buyer_id_contacts_id_fk" FOREIGN KEY ("version_buyer_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_version_responsable_id_users_id_fk" FOREIGN KEY ("version_responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_version_price_trigger_id_price_triggers_id_fk" FOREIGN KEY ("version_price_trigger_id") REFERENCES "public"."price_triggers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operations_v" ADD CONSTRAINT "_operations_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "price_triggers" ADD CONSTRAINT "price_triggers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "price_triggers" ADD CONSTRAINT "price_triggers_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "price_triggers" ADD CONSTRAINT "price_triggers_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "price_triggers" ADD CONSTRAINT "price_triggers_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "price_triggers" ADD CONSTRAINT "price_triggers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_price_triggers_v" ADD CONSTRAINT "_price_triggers_v_parent_id_price_triggers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."price_triggers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_price_triggers_v" ADD CONSTRAINT "_price_triggers_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_price_triggers_v" ADD CONSTRAINT "_price_triggers_v_version_contact_id_contacts_id_fk" FOREIGN KEY ("version_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_price_triggers_v" ADD CONSTRAINT "_price_triggers_v_version_instrument_id_instruments_id_fk" FOREIGN KEY ("version_instrument_id") REFERENCES "public"."instruments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_price_triggers_v" ADD CONSTRAINT "_price_triggers_v_version_responsable_id_users_id_fk" FOREIGN KEY ("version_responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_price_triggers_v" ADD CONSTRAINT "_price_triggers_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_price_trigger_id_price_triggers_id_fk" FOREIGN KEY ("price_trigger_id") REFERENCES "public"."price_triggers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_operation_id_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_parent_id_alerts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."alerts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_version_price_trigger_id_price_triggers_id_fk" FOREIGN KEY ("version_price_trigger_id") REFERENCES "public"."price_triggers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_version_quote_id_quotes_id_fk" FOREIGN KEY ("version_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_version_resolved_by_id_users_id_fk" FOREIGN KEY ("version_resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_version_operation_id_operations_id_fk" FOREIGN KEY ("version_operation_id") REFERENCES "public"."operations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_alerts_v" ADD CONSTRAINT "_alerts_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exports" ADD CONSTRAINT "exports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "imports" ADD CONSTRAINT "imports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contacts_fk" FOREIGN KEY ("contacts_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_operations_fk" FOREIGN KEY ("operations_id") REFERENCES "public"."operations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_price_triggers_fk" FOREIGN KEY ("price_triggers_id") REFERENCES "public"."price_triggers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_alerts_fk" FOREIGN KEY ("alerts_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instruments_fk" FOREIGN KEY ("instruments_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quotes_fk" FOREIGN KEY ("quotes_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "contacts_tenant_idx" ON "contacts" USING btree ("tenant_id");
  CREATE INDEX "contacts_updated_at_idx" ON "contacts" USING btree ("updated_at");
  CREATE INDEX "contacts_created_at_idx" ON "contacts" USING btree ("created_at");
  CREATE INDEX "operations_tenant_idx" ON "operations" USING btree ("tenant_id");
  CREATE INDEX "operations_seller_idx" ON "operations" USING btree ("seller_id");
  CREATE INDEX "operations_buyer_idx" ON "operations" USING btree ("buyer_id");
  CREATE INDEX "operations_responsable_idx" ON "operations" USING btree ("responsable_id");
  CREATE INDEX "operations_price_trigger_idx" ON "operations" USING btree ("price_trigger_id");
  CREATE INDEX "operations_updated_by_idx" ON "operations" USING btree ("updated_by_id");
  CREATE INDEX "operations_updated_at_idx" ON "operations" USING btree ("updated_at");
  CREATE INDEX "operations_created_at_idx" ON "operations" USING btree ("created_at");
  CREATE INDEX "_operations_v_parent_idx" ON "_operations_v" USING btree ("parent_id");
  CREATE INDEX "_operations_v_version_version_tenant_idx" ON "_operations_v" USING btree ("version_tenant_id");
  CREATE INDEX "_operations_v_version_version_seller_idx" ON "_operations_v" USING btree ("version_seller_id");
  CREATE INDEX "_operations_v_version_version_buyer_idx" ON "_operations_v" USING btree ("version_buyer_id");
  CREATE INDEX "_operations_v_version_version_responsable_idx" ON "_operations_v" USING btree ("version_responsable_id");
  CREATE INDEX "_operations_v_version_version_price_trigger_idx" ON "_operations_v" USING btree ("version_price_trigger_id");
  CREATE INDEX "_operations_v_version_version_updated_by_idx" ON "_operations_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_operations_v_version_version_updated_at_idx" ON "_operations_v" USING btree ("version_updated_at");
  CREATE INDEX "_operations_v_version_version_created_at_idx" ON "_operations_v" USING btree ("version_created_at");
  CREATE INDEX "_operations_v_created_at_idx" ON "_operations_v" USING btree ("created_at");
  CREATE INDEX "_operations_v_updated_at_idx" ON "_operations_v" USING btree ("updated_at");
  CREATE INDEX "price_triggers_tenant_idx" ON "price_triggers" USING btree ("tenant_id");
  CREATE INDEX "price_triggers_contact_idx" ON "price_triggers" USING btree ("contact_id");
  CREATE INDEX "price_triggers_instrument_idx" ON "price_triggers" USING btree ("instrument_id");
  CREATE INDEX "price_triggers_responsable_idx" ON "price_triggers" USING btree ("responsable_id");
  CREATE INDEX "price_triggers_updated_by_idx" ON "price_triggers" USING btree ("updated_by_id");
  CREATE INDEX "price_triggers_updated_at_idx" ON "price_triggers" USING btree ("updated_at");
  CREATE INDEX "price_triggers_created_at_idx" ON "price_triggers" USING btree ("created_at");
  CREATE INDEX "_price_triggers_v_parent_idx" ON "_price_triggers_v" USING btree ("parent_id");
  CREATE INDEX "_price_triggers_v_version_version_tenant_idx" ON "_price_triggers_v" USING btree ("version_tenant_id");
  CREATE INDEX "_price_triggers_v_version_version_contact_idx" ON "_price_triggers_v" USING btree ("version_contact_id");
  CREATE INDEX "_price_triggers_v_version_version_instrument_idx" ON "_price_triggers_v" USING btree ("version_instrument_id");
  CREATE INDEX "_price_triggers_v_version_version_responsable_idx" ON "_price_triggers_v" USING btree ("version_responsable_id");
  CREATE INDEX "_price_triggers_v_version_version_updated_by_idx" ON "_price_triggers_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_price_triggers_v_version_version_updated_at_idx" ON "_price_triggers_v" USING btree ("version_updated_at");
  CREATE INDEX "_price_triggers_v_version_version_created_at_idx" ON "_price_triggers_v" USING btree ("version_created_at");
  CREATE INDEX "_price_triggers_v_created_at_idx" ON "_price_triggers_v" USING btree ("created_at");
  CREATE INDEX "_price_triggers_v_updated_at_idx" ON "_price_triggers_v" USING btree ("updated_at");
  CREATE INDEX "alerts_tenant_idx" ON "alerts" USING btree ("tenant_id");
  CREATE INDEX "alerts_price_trigger_idx" ON "alerts" USING btree ("price_trigger_id");
  CREATE INDEX "alerts_quote_idx" ON "alerts" USING btree ("quote_id");
  CREATE INDEX "alerts_resolved_by_idx" ON "alerts" USING btree ("resolved_by_id");
  CREATE INDEX "alerts_operation_idx" ON "alerts" USING btree ("operation_id");
  CREATE INDEX "alerts_updated_by_idx" ON "alerts" USING btree ("updated_by_id");
  CREATE INDEX "alerts_updated_at_idx" ON "alerts" USING btree ("updated_at");
  CREATE INDEX "alerts_created_at_idx" ON "alerts" USING btree ("created_at");
  CREATE INDEX "_alerts_v_parent_idx" ON "_alerts_v" USING btree ("parent_id");
  CREATE INDEX "_alerts_v_version_version_tenant_idx" ON "_alerts_v" USING btree ("version_tenant_id");
  CREATE INDEX "_alerts_v_version_version_price_trigger_idx" ON "_alerts_v" USING btree ("version_price_trigger_id");
  CREATE INDEX "_alerts_v_version_version_quote_idx" ON "_alerts_v" USING btree ("version_quote_id");
  CREATE INDEX "_alerts_v_version_version_resolved_by_idx" ON "_alerts_v" USING btree ("version_resolved_by_id");
  CREATE INDEX "_alerts_v_version_version_operation_idx" ON "_alerts_v" USING btree ("version_operation_id");
  CREATE INDEX "_alerts_v_version_version_updated_by_idx" ON "_alerts_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_alerts_v_version_version_updated_at_idx" ON "_alerts_v" USING btree ("version_updated_at");
  CREATE INDEX "_alerts_v_version_version_created_at_idx" ON "_alerts_v" USING btree ("version_created_at");
  CREATE INDEX "_alerts_v_created_at_idx" ON "_alerts_v" USING btree ("created_at");
  CREATE INDEX "_alerts_v_updated_at_idx" ON "_alerts_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "instruments_symbol_idx" ON "instruments" USING btree ("symbol");
  CREATE INDEX "instruments_updated_at_idx" ON "instruments" USING btree ("updated_at");
  CREATE INDEX "instruments_created_at_idx" ON "instruments" USING btree ("created_at");
  CREATE INDEX "quotes_instrument_idx" ON "quotes" USING btree ("instrument_id");
  CREATE INDEX "quotes_updated_at_idx" ON "quotes" USING btree ("updated_at");
  CREATE INDEX "quotes_created_at_idx" ON "quotes" USING btree ("created_at");
  CREATE INDEX "exports_tenant_idx" ON "exports" USING btree ("tenant_id");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_tenant_idx" ON "imports" USING btree ("tenant_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_contacts_id_idx" ON "payload_locked_documents_rels" USING btree ("contacts_id");
  CREATE INDEX "payload_locked_documents_rels_operations_id_idx" ON "payload_locked_documents_rels" USING btree ("operations_id");
  CREATE INDEX "payload_locked_documents_rels_price_triggers_id_idx" ON "payload_locked_documents_rels" USING btree ("price_triggers_id");
  CREATE INDEX "payload_locked_documents_rels_alerts_id_idx" ON "payload_locked_documents_rels" USING btree ("alerts_id");
  CREATE INDEX "payload_locked_documents_rels_instruments_id_idx" ON "payload_locked_documents_rels" USING btree ("instruments_id");
  CREATE INDEX "payload_locked_documents_rels_quotes_id_idx" ON "payload_locked_documents_rels" USING btree ("quotes_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants" CASCADE;
  DROP TABLE "users_tenants" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "contacts" CASCADE;
  DROP TABLE "operations" CASCADE;
  DROP TABLE "_operations_v" CASCADE;
  DROP TABLE "price_triggers" CASCADE;
  DROP TABLE "_price_triggers_v" CASCADE;
  DROP TABLE "alerts" CASCADE;
  DROP TABLE "_alerts_v" CASCADE;
  DROP TABLE "instruments" CASCADE;
  DROP TABLE "quotes" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "feed_status" CASCADE;
  DROP TYPE "public"."enum_users_tenants_role";
  DROP TYPE "public"."enum_contacts_type";
  DROP TYPE "public"."enum_operations_grain";
  DROP TYPE "public"."enum_operations_currency";
  DROP TYPE "public"."enum_operations_stage";
  DROP TYPE "public"."enum__operations_v_version_grain";
  DROP TYPE "public"."enum__operations_v_version_currency";
  DROP TYPE "public"."enum__operations_v_version_stage";
  DROP TYPE "public"."enum_price_triggers_side";
  DROP TYPE "public"."enum_price_triggers_status";
  DROP TYPE "public"."enum__price_triggers_v_version_side";
  DROP TYPE "public"."enum__price_triggers_v_version_status";
  DROP TYPE "public"."enum_alerts_kind";
  DROP TYPE "public"."enum_alerts_resolution";
  DROP TYPE "public"."enum__alerts_v_version_kind";
  DROP TYPE "public"."enum__alerts_v_version_resolution";
  DROP TYPE "public"."enum_instruments_grain";
  DROP TYPE "public"."enum_instruments_currency";
  DROP TYPE "public"."enum_quotes_source";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
