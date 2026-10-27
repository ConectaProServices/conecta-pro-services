import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchedulings1793060000000 implements MigrationInterface {
    name = 'CreateSchedulings1793060000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "scheduling"`);

        await queryRunner.query(`CREATE TYPE "scheduling"."schedulings_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED')`);

        await queryRunner.query(`CREATE TABLE "scheduling"."schedulings" (
            "schedulingId" uuid NOT NULL,
            "customerId" uuid NOT NULL,
            "serviceId" uuid NOT NULL,
            "professionalId" uuid NOT NULL,
            "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "status" "scheduling"."schedulings_status_enum" NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP WITH TIME ZONE,
            CONSTRAINT "PK_schedulings_schedulingId" PRIMARY KEY ("schedulingId")
        )`);

        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
        await queryRunner.query(`ALTER TABLE "scheduling"."schedulings"
            ADD CONSTRAINT "EXCL_schedulings_no_overlap"
            EXCLUDE USING gist (
                "professionalId" WITH =,
                tstzrange("startsAt", "endsAt") WITH &&
            )
            WHERE ("status" IN ('PENDING', 'CONFIRMED') AND "deletedAt" IS NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduling"."schedulings" DROP CONSTRAINT "EXCL_schedulings_no_overlap"`);
        await queryRunner.query(`DROP TABLE "scheduling"."schedulings"`);
        await queryRunner.query(`DROP TYPE "scheduling"."schedulings_status_enum"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "scheduling"`);
    }
}
