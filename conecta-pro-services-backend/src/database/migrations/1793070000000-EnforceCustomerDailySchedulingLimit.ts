import { MigrationInterface, QueryRunner } from "typeorm";

export class EnforceCustomerDailySchedulingLimit1793070000000 implements MigrationInterface {
    name = 'EnforceCustomerDailySchedulingLimit1793070000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_schedulings_customer_sao_paulo_date_active"
            ON "scheduling"."schedulings" (
                "customerId",
                (("startsAt" AT TIME ZONE 'America/Sao_Paulo')::date)
            )
            WHERE ("status" IN ('PENDING', 'CONFIRMED') AND "deletedAt" IS NULL)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "scheduling"."UQ_schedulings_customer_sao_paulo_date_active"
        `);
    }
}
