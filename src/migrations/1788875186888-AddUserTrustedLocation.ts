import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTrustedLocation1788875186888 implements MigrationInterface {
  name = 'AddUserTrustedLocation1788875186888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_trusted_location" ("id" SERIAL NOT NULL, "city" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_86febc84401f3e6cd74b11ad260" UNIQUE ("userId", "city"), CONSTRAINT "PK_3db8976b31f1696b5a4f91a55cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_trusted_location" ADD CONSTRAINT "FK_2746a531b7269c996560a96c503" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_trusted_location" DROP CONSTRAINT "FK_2746a531b7269c996560a96c503"`,
    );
    await queryRunner.query(`DROP TABLE "user_trusted_location"`);
  }
}
