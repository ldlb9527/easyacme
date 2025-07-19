package migration

import (
	"easyacme/internal/common"
	"gorm.io/gorm"
)

var AllMigration = make([]*common.Migration, 0)

func init() {
	AllMigration = append(AllMigration, initTable)
}

var initTable = &common.Migration{
	ID: "initTable",
	Action: func(tx *gorm.DB) error {
		// 创建 acme_accounts 表
		err := tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."acme_accounts" (
			"id" text NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"name" text,
			"key_pem" text,
			"key_type" text,
			"uri" text,
			"server" text,
			"email" text,
			"status" text,
			"eab_key_id" text,
			"eab_mac_key" text,
			"registration" jsonb,
			CONSTRAINT "acme_accounts_pkey" PRIMARY KEY ("id")
		);
		`).Error
		if err != nil {
			return err
		}

		// 创建 acme_certs 表
		err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."acme_certs" (
			"id" text NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"account_id" text,
			"dns_provider_id" text,
			"cert_url" text,
			"cert_stable_url" text,
			"private_key" text,
			"certificate" text,
			"issuer_certificate" text,
			"csr" text,
			"key_type" text,
			"domains" text[],
			"cert_type" text DEFAULT 'DV'::text,
			"issued_at" timestamp(6),
			"validity_days" int4,
			"cert_status" text DEFAULT 'not_issued'::text,
			CONSTRAINT "acme_certs_pkey" PRIMARY KEY ("id")
		);
		`).Error
		if err != nil {
			return err
		}

		// 创建 dns_providers 表
		err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."dns_providers" (
			"id" text NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"name" text,
			"type" text,
			"secret_id" text,
			"secret_key" text,
			"notes" text,
			CONSTRAINT "dns_providers_pkey" PRIMARY KEY ("id")
		);
		`).Error
		if err != nil {
			return err
		}

		// 创建 roles 表
		err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."roles" (
			"id" BIGSERIAL NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"name" varchar(100) NOT NULL,
			"description" varchar(255),
			CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
		);
		
		CREATE UNIQUE INDEX IF NOT EXISTS "idx_roles_name" ON "public"."roles" USING btree (
			"name" ASC NULLS LAST
		);
		`).Error
		if err != nil {
			return err
		}

		// 创建 users 表
		err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."users" (
			"id" BIGSERIAL NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"username" varchar(255) NOT NULL,
			"password" varchar(128) NOT NULL,
			"enabled" bool NOT NULL DEFAULT true,
			"last_login_at" timestamptz(6),
			"language" varchar(64) NOT NULL DEFAULT 'zh-CN'::character varying,
			CONSTRAINT "users_pkey" PRIMARY KEY ("id")
		);
		
		CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_username" ON "public"."users" USING btree (
			"username" ASC NULLS LAST
		);
		`).Error
		if err != nil {
			return err
		}

		// 创建 user_roles 表
		err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."user_roles" (
			"id" BIGSERIAL NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"user_id" bigint NOT NULL,
			"role_id" bigint NOT NULL,
			CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id"),
			CONSTRAINT "fk_users_roles" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id"),
			CONSTRAINT "fk_roles_users" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id")
		);
		`).Error
		if err != nil {
			return err
		}

		// 创建 role_permissions 表
		err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
			"id" BIGSERIAL NOT NULL,
			"created_at" timestamptz(6),
			"updated_at" timestamptz(6),
			"role_id" bigint NOT NULL,
			"permission" varchar(36) NOT NULL,
			CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id"),
			CONSTRAINT "fk_roles_permissions" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id")
		);
		`).Error
		if err != nil {
			return err
		}
		return nil
	},
}
