import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditOutcomeColumns1787829535767 implements MigrationInterface {
    name = 'AddAuditOutcomeColumns1787829535767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_log" ADD "method" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD "statusCode" integer NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_2621409ebc295c5da7ff3e4139" ON "audit_log"  ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2621409ebc295c5da7ff3e4139"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP COLUMN "statusCode"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP COLUMN "method"`);
    }

}
