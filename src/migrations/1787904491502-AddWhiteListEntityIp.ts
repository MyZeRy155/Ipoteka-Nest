import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWhiteListEntityIp1787904491502 implements MigrationInterface {
    name = 'AddWhiteListEntityIp1787904491502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "white_list_ip" ("id" SERIAL NOT NULL, "ipAddress" character varying(45) NOT NULL, "label" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0670e8ddfa84f54b8dabb4e9764" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8ab589f7c655a685e9033840cc" ON "white_list_ip"  ("ipAddress") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8ab589f7c655a685e9033840cc"`);
        await queryRunner.query(`DROP TABLE "white_list_ip"`);
    }

}
