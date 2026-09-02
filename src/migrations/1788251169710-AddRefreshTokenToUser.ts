import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenToUser1788251169710 implements MigrationInterface {
    name = 'AddRefreshTokenToUser1788251169710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "hashedRefreshToken" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hashedRefreshToken"`);
    }

}
