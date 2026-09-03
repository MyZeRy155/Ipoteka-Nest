import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToCalculation1788437734712 implements MigrationInterface {
    name = 'AddUserToCalculation1788437734712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calculation" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "calculation" ADD CONSTRAINT "FK_6e394803e4300099cd424458134" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calculation" DROP CONSTRAINT "FK_6e394803e4300099cd424458134"`);
        await queryRunner.query(`ALTER TABLE "calculation" DROP COLUMN "userId"`);
    }

}
