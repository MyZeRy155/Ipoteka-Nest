import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1786539249367 implements MigrationInterface {
  name = 'InitSchema1786539249367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calculation" ("id" SERIAL NOT NULL, "mortgageTermMonths" integer NOT NULL, "interestRate" double precision NOT NULL, "mortgageAmount" double precision NOT NULL, "monthlyPayment" double precision NOT NULL, "totalDebt" double precision NOT NULL, "overPayment" double precision NOT NULL, CONSTRAINT "PK_67320bae23a5bfa027f881c271b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "calculation"`);
  }
}
