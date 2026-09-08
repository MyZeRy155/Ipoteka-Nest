import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrustedToAuditLog1788868198846 implements MigrationInterface {
  name = 'AddTrustedToAuditLog1788868198846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_log" ADD "trusted" boolean NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_log" DROP COLUMN "trusted"`);
  }
}
