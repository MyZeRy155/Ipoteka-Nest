import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserStatus1788355518094 implements MigrationInterface {
    name = 'AddUserStatus1788355518094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "status" character varying NOT NULL DEFAULT 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    }

}
