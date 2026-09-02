import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUser1788344483841 implements MigrationInterface {
    name = 'AddRoleToUser1788344483841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "role" character varying NOT NULL DEFAULT 'user'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
    }

}
