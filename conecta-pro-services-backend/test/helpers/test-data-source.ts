import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CreateSchedulings1793060000000 } from '../../src/database/migrations/1793060000000-CreateScheduling.js';
import { EnforceCustomerDailySchedulingLimit1793070000000 } from '../../src/database/migrations/1793070000000-EnforceCustomerDailySchedulingLimit.js';
import { SchedulingEntity } from '../../src/infraestructure/persistence/scheduling/scheduling.orm-entity.js';

export interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável ${name} não definida: configure o banco exclusivo de testes no .env (ver .env.example).`);
  }
  return value;
}

/**
 * Lê TEST_DB_* e recusa configurações que possam apontar para o banco de desenvolvimento.
 */
export function readTestDatabaseConfig(): TestDatabaseConfig {
  const config: TestDatabaseConfig = {
    host: requireEnv('TEST_DB_HOST'),
    port: Number(requireEnv('TEST_DB_PORT')),
    username: requireEnv('TEST_DB_USERNAME'),
    password: requireEnv('TEST_DB_PASSWORD'),
    database: requireEnv('TEST_DB_NAME'),
  };

  if (!config.database.endsWith('_test')) {
    throw new Error(`TEST_DB_NAME="${config.database}" recusado: o banco de testes deve terminar com "_test".`);
  }
  if (config.database === process.env.DB_NAME) {
    throw new Error('TEST_DB_NAME é igual a DB_NAME: os testes não podem usar o banco de desenvolvimento.');
  }
  if (config.username === process.env.DB_USERNAME) {
    throw new Error('TEST_DB_USERNAME é igual a DB_USERNAME: use um usuário exclusivo de testes.');
  }
  if (!Number.isInteger(config.port) || config.port <= 0) {
    throw new Error(`TEST_DB_PORT="${process.env.TEST_DB_PORT}" inválido.`);
  }

  return config;
}

export function createTestDataSource(config: TestDatabaseConfig): DataSource {
  return new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [SchedulingEntity],
    migrations: [CreateSchedulings1793060000000, EnforceCustomerDailySchedulingLimit1793070000000],
    synchronize: false,
    logging: false,
  });
}

export interface ServerIdentity {
  name: string;
  usuario: string;
  porta: number;
}

/**
 * Confirma, pelo próprio servidor, em qual banco e com qual usuário a conexão foi aberta.
 * Não compara inet_server_port() com TEST_DB_PORT: com port forwarding do Docker (ex.: 5435->5432)
 * o servidor reporta a porta interna do contêiner.
 */
export async function assertTestDatabaseIdentity(dataSource: DataSource, config: TestDatabaseConfig): Promise<ServerIdentity> {
  const [identity] = (await dataSource.query(
    'SELECT current_database() AS name, current_user AS usuario, inet_server_port() AS porta',
  )) as ServerIdentity[];

  if (identity.name !== config.database || identity.usuario !== config.username) {
    throw new Error(
      `Conexão inesperada: banco="${identity.name}", usuário="${identity.usuario}" ` +
        `(esperado banco="${config.database}", usuário="${config.username}").`,
    );
  }

  return identity;
}
