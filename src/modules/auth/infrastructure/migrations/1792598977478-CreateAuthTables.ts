import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAuthTables1792598977478 implements MigrationInterface {
  name = 'CreateAuthTables1792598977478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. User table
    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          { name: 'id', type: 'text', isPrimary: true },
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text', isUnique: true },
          { name: 'emailVerified', type: 'boolean', default: false },
          { name: 'image', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // 2. Session table
    await queryRunner.createTable(
      new Table({
        name: 'session',
        columns: [
          { name: 'id', type: 'text', isPrimary: true },
          { name: 'expiresAt', type: 'timestamptz' },
          { name: 'token', type: 'text', isUnique: true },
          { name: 'createdAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'ipAddress', type: 'text', isNullable: true },
          { name: 'userAgent', type: 'text', isNullable: true },
          { name: 'userId', type: 'text' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'session',
      new TableIndex({
        name: 'session_userId_idx',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createForeignKey(
      'session',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 3. Account table
    await queryRunner.createTable(
      new Table({
        name: 'account',
        columns: [
          { name: 'id', type: 'text', isPrimary: true },
          { name: 'accountId', type: 'text' },
          { name: 'providerId', type: 'text' },
          { name: 'userId', type: 'text' },
          { name: 'accessToken', type: 'text', isNullable: true },
          { name: 'refreshToken', type: 'text', isNullable: true },
          { name: 'idToken', type: 'text', isNullable: true },
          { name: 'accessTokenExpiresAt', type: 'timestamptz', isNullable: true },
          { name: 'refreshTokenExpiresAt', type: 'timestamptz', isNullable: true },
          { name: 'scope', type: 'text', isNullable: true },
          { name: 'password', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'account',
      new TableIndex({
        name: 'account_userId_idx',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createForeignKey(
      'account',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 4. Verification table
    await queryRunner.createTable(
      new Table({
        name: 'verification',
        columns: [
          { name: 'id', type: 'text', isPrimary: true },
          { name: 'identifier', type: 'text' },
          { name: 'value', type: 'text' },
          { name: 'expiresAt', type: 'timestamptz' },
          { name: 'createdAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'verification',
      new TableIndex({
        name: 'verification_identifier_idx',
        columnNames: ['identifier'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('verification', true);
    await queryRunner.dropTable('account', true);
    await queryRunner.dropTable('session', true);
    await queryRunner.dropTable('user', true);
  }
}
