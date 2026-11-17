import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { SchedulingEntity } from '../infraestructure/persistence/scheduling/scheduling.orm-entity.js';

// Resolve as migrations a partir da localização deste arquivo:
// - desenvolvimento (CLI via ts-node): src/database/migrations/*.ts
// - runtime compilado (contêiner):     dist/database/migrations/*.js
// A extensão segue a do próprio arquivo para não capturar os .d.ts gerados em dist/.
const currentFile = fileURLToPath(import.meta.url);
const migrationsExtension = currentFile.endsWith('.ts') ? 'ts' : 'js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [SchedulingEntity],
  migrations: [join(dirname(currentFile), 'migrations', `*.${migrationsExtension}`)],
  synchronize: false,
});
