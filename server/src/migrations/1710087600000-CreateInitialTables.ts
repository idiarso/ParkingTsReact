import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1710087600000 implements MigrationInterface {
    name = 'CreateInitialTables1710087600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for user roles
        await queryRunner.query(`
            CREATE TYPE "user_role_enum" AS ENUM ('admin', 'operator', 'cashier')
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" "user_role_enum" NOT NULL DEFAULT 'operator',
                "is_active" boolean NOT NULL DEFAULT true,
                "last_login" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_username" UNIQUE ("username"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create vehicles table
        await queryRunner.query(`
            CREATE TABLE "vehicles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "license_plate" character varying NOT NULL,
                "vehicle_type" character varying NOT NULL,
                "image_url" character varying,
                "is_parked" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_vehicles" PRIMARY KEY ("id")
            )
        `);

        // Create parking_sessions table
        await queryRunner.query(`
            CREATE TABLE "parking_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "vehicle_id" uuid NOT NULL,
                "ticket_number" character varying NOT NULL,
                "entry_time" TIMESTAMP NOT NULL,
                "exit_time" TIMESTAMP,
                "fee" decimal(10,2),
                "is_paid" boolean NOT NULL DEFAULT false,
                "payment_details" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_parking_sessions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_parking_sessions_vehicle" FOREIGN KEY ("vehicle_id") 
                    REFERENCES "vehicles" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Create rates table
        await queryRunner.query(`
            CREATE TABLE "rates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "vehicle_type" character varying NOT NULL,
                "base_rate" decimal(10,2) NOT NULL,
                "hourly_rate" decimal(10,2) NOT NULL,
                "daily_max_rate" decimal(10,2),
                "special_rates" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_rates" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_vehicles_license_plate" ON "vehicles" ("license_plate");
            CREATE INDEX "IDX_parking_sessions_ticket_number" ON "parking_sessions" ("ticket_number");
            CREATE INDEX "IDX_rates_vehicle_type" ON "rates" ("vehicle_type");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_rates_vehicle_type"`);
        await queryRunner.query(`DROP INDEX "IDX_parking_sessions_ticket_number"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicles_license_plate"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "rates"`);
        await queryRunner.query(`DROP TABLE "parking_sessions"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
    }
} 