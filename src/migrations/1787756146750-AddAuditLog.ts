import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLog1787756146750 implements MigrationInterface {
    name = 'AddAuditLog1787756146750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "userId" integer, "ipAddress" character varying(45) NOT NULL, "countryCode" character varying(10), "requestedUrl" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d1f43483b2c58d5a55f6a2f5ab" ON "audit_log"  ("ipAddress") `);
        await queryRunner.query(`CREATE INDEX "IDX_78e013ffae12f5a1fc1dbefff9" ON "audit_log"  ("createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_78e013ffae12f5a1fc1dbefff9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1f43483b2c58d5a55f6a2f5ab"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
    }

}
