# 09-07 - Testes Automatizados com PostgreSQL

## 1. Configuração

| Item | Valor |
| --- | --- |
| Script | `"test:integration": "vitest run --config ./vitest.config.integration.ts"` (novo em `package.json`) |
| Config | `vitest.config.integration.ts` (novo): `include: ['**/*.integration-spec.ts']`, `fileParallelism: false` |
| Separação | `pnpm test` → `**/*.spec.ts` (sem banco); `pnpm test:e2e` → `**/*.e2e-spec.ts`; `pnpm test:integration` → `**/*.integration-spec.ts`. O sufixo `-spec.ts` não casa com `*.spec.ts`, então os testes de integração **não** entram na suíte unitária |
| Banco | `conecta_test`, usuário `conecta_test_user` (09-02), variáveis `TEST_DB_*` do `.env` local |
| DataSource de testes | `test/helpers/test-data-source.ts` (novo): `entities: [SchedulingEntity]`, `migrations: [CreateSchedulings1793060000000]`, `synchronize: false` |

### `vitest.config.integration.ts`

```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Testes de integração com PostgreSQL real (banco exclusivo de testes, variáveis TEST_DB_*).
// Separados da suíte unitária (pnpm test) e do E2E (pnpm test:e2e).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.integration-spec.ts'],
    fileParallelism: false,
  },
});
```

### `test/helpers/test-data-source.ts`

```typescript
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CreateSchedulings1793060000000 } from '../../src/database/migrations/1793060000000-CreateScheduling.js';
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
    migrations: [CreateSchedulings1793060000000],
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
```

## 2. Os 10 pontos de segurança

| # | Ponto | Situação |
| --- | --- | --- |
| 1 | Banco exclusivo de testes | `conecta_test` (dono: `conecta_test_user`) |
| 2 | Variáveis `TEST_DB_*` | Definidas no `.env` local; chaves vazias no `.env.example` |
| 3 | Host e porta | `localhost:5435` (porta publicada do container) |
| 4 | Nome distinto do dev | `conecta_test` ≠ `conecta_dev`; o helper recusa nome igual a `DB_NAME` ou sem sufixo `_test` |
| 5 | Usuário de testes | `conecta_test_user` (sem superusuário, sem `CREATEDB`/`CREATEROLE`) |
| 6 | Credenciais distintas | Senha própria, gerada aleatoriamente; o helper recusa `TEST_DB_USERNAME == DB_USERNAME` |
| 7 | Sem produção | Não há URL ou credencial de produção no projeto |
| 8 | Porta Docker compreendida | 5435 (host) → 5432 (container); `inet_server_port()` não é comparado com `TEST_DB_PORT` |
| 9 | Migrations compatíveis | A mesma classe real `CreateSchedulings1793060000000`, aplicada por `runMigrations()` |
| 10 | Autorização | Banco de testes criado e autorizado pela equipe nesta etapa (09-02) |

Salvaguardas adicionais:

- **Identidade validada antes das migrations:** `assertTestDatabaseIdentity` compara `current_database()` e `current_user` com o esperado e lança erro se divergirem. `runMigrations()` só roda depois disso.
- **Sem `TRUNCATE`:** cada teste usa UUIDs próprios; o `afterAll` apaga **somente** os `schedulingId` criados no próprio arquivo (`delete({ schedulingId: In(createdIds) })`). `TEST_DB_ALLOW_DESTRUCTIVE` continua `false` e não é usado.
- **Encerramento seguro:** `try/catch` no `beforeAll` (destrói a conexão se o setup falhar) e `finally` no `afterAll` com `if (dataSource?.isInitialized) await dataSource.destroy()`.
- **Isolamento de privilégios:** `conecta_test_user` não consegue conectar em `conecta_dev` nem em `conecta_db` (`42501`, 09-02 §4).

## 3. Código completo do teste

`test/integration/typeorm-scheduling.repository.integration-spec.ts`

```typescript
import { randomUUID } from 'node:crypto';
import { In, type DataSource, type Repository } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SchedulingStatus } from '../../src/common/enum/scheduling-status.enum.js';
import { SchedulingConflictException } from '../../src/common/exceptions/scheduling-conflict.exception.js';
import { DEMO_SERVICE_ID } from '../../src/infraestructure/catalog/in-memory-service-catalog.js';
import { SchedulingEntity } from '../../src/infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { TypeOrmSchedulingRepository } from '../../src/infraestructure/persistence/scheduling/typeorm-scheduling.repository.js';
import { Scheduling } from '../../src/modules/scheduling/entities/scheduling.entity.js';
import {
  assertTestDatabaseIdentity,
  createTestDataSource,
  readTestDatabaseConfig,
  type ServerIdentity,
  type TestDatabaseConfig,
} from '../helpers/test-data-source.js';

const HOUR_IN_MS = 60 * 60 * 1000;

// Horas inteiras evitam diferenças de precisão (ms vs. µs) entre JavaScript e PostgreSQL.
const hoursFromNowRounded = (hours: number) => {
  const date = new Date(Date.now() + hours * HOUR_IN_MS);
  date.setUTCMinutes(0, 0, 0);
  return date;
};

const buildScheduling = (overrides: Partial<{ professionalId: string; startsAt: Date; endsAt: Date }> = {}) => {
  const startsAt = overrides.startsAt ?? hoursFromNowRounded(72);
  return Scheduling.request({
    schedulingId: randomUUID(),
    customerId: randomUUID(),
    serviceId: DEMO_SERVICE_ID,
    professionalId: overrides.professionalId ?? randomUUID(),
    startsAt,
    endsAt: overrides.endsAt ?? new Date(startsAt.getTime() + HOUR_IN_MS),
  });
};

describe('TypeOrmSchedulingRepository — integração com PostgreSQL real (banco de testes)', () => {
  let config: TestDatabaseConfig;
  let dataSource: DataSource;
  let identity: ServerIdentity;
  let ormRepository: Repository<SchedulingEntity>;
  let repository: TypeOrmSchedulingRepository;
  // Isolamento: cada teste usa UUIDs próprios; a limpeza remove somente esses registros (sem TRUNCATE).
  const createdIds: string[] = [];

  beforeAll(async () => {
    // 1. DataSource seguro (recusa banco/usuário de desenvolvimento)
    config = readTestDatabaseConfig();
    dataSource = createTestDataSource(config);

    try {
      // 2. Conexão
      await dataSource.initialize();
      // 3. Identidade reportada pelo servidor
      identity = await assertTestDatabaseIdentity(dataSource, config);
      // 5. Migrations autorizadas, somente depois de validar a identidade
      await dataSource.runMigrations({ transaction: 'each' });
    } catch (error) {
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
      throw error;
    }

    // 6. Adaptador real
    ormRepository = dataSource.getRepository(SchedulingEntity);
    repository = new TypeOrmSchedulingRepository(ormRepository);
  });

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized && createdIds.length > 0) {
        await ormRepository.delete({ schedulingId: In(createdIds) });
      }
    } finally {
      // 11. Encerramento seguro
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
    }
  });

  it('conecta no banco e com o usuário de testes esperados, com a migration aplicada', async () => {
    // 3 e 4. Identidade e parâmetros de conexão
    expect(identity.name).toBe(config.database);
    expect(identity.usuario).toBe(config.username);
    expect(dataSource.options).toMatchObject({ host: config.host, port: config.port, database: config.database });
    // inet_server_port() é a porta interna do PostgreSQL; não é comparada com TEST_DB_PORT (port forwarding).
    expect(Number(identity.porta)).toBeGreaterThan(0);

    expect(await dataSource.showMigrations()).toBe(false); // false = nenhuma migration pendente
    const applied = (await dataSource.query('SELECT name FROM public.migrations')) as { name: string }[];
    expect(applied.map((m) => m.name)).toContain('CreateSchedulings1793060000000');
  });

  it('save() grava o agendamento e o registro no banco coincide com a entidade de domínio', async () => {
    // 7. Entidade de domínio válida
    const scheduling = buildScheduling();
    createdIds.push(scheduling.schedulingId);

    // 8. Gravação pelo adaptador real
    const saved = await repository.save(scheduling);

    // 9. Consulta direta ao banco (SQL, sem passar pelo adaptador)
    const rows = (await dataSource.query(
      `SELECT "schedulingId", "customerId", "serviceId", "professionalId", "startsAt", "endsAt", "status", "deletedAt"
         FROM scheduling.schedulings WHERE "schedulingId" = $1`,
      [scheduling.schedulingId],
    )) as Array<Record<string, unknown>>;

    // 10. Identificador e atributos persistidos
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      schedulingId: scheduling.schedulingId,
      customerId: scheduling.customerId,
      serviceId: scheduling.serviceId,
      professionalId: scheduling.professionalId,
      startsAt: scheduling.startsAt,
      endsAt: scheduling.endsAt,
      status: SchedulingStatus.PENDING,
      deletedAt: null,
    });

    // O retorno do adaptador é a entidade de domínio reconstruída pelo mapper
    expect(saved).toBeInstanceOf(Scheduling);
    expect(saved.schedulingId).toBe(scheduling.schedulingId);
    expect(saved.getStatus()).toBe(SchedulingStatus.PENDING);
  });

  it('findScheduleById() reconstrói a entidade de domínio a partir do banco', async () => {
    const scheduling = buildScheduling();
    createdIds.push(scheduling.schedulingId);
    await repository.save(scheduling);

    const found = await repository.findScheduleById(scheduling.schedulingId);

    expect(found).toBeInstanceOf(Scheduling);
    expect(found?.customerId).toBe(scheduling.customerId);
    expect(found?.startsAt).toEqual(scheduling.startsAt);
    expect(found?.endsAt).toEqual(scheduling.endsAt);
    expect(found?.getStatus()).toBe(SchedulingStatus.PENDING);
    expect(await repository.findScheduleById(randomUUID())).toBeNull();
  });

  it('existsOverlapping() detecta sobreposição do mesmo prestador e ignora intervalos adjacentes', async () => {
    const professionalId = randomUUID();
    const scheduling = buildScheduling({ professionalId });
    createdIds.push(scheduling.schedulingId);
    await repository.save(scheduling);

    const halfHour = 30 * 60 * 1000;
    const overlappingStart = new Date(scheduling.startsAt.getTime() + halfHour);

    expect(
      await repository.existsOverlapping(professionalId, overlappingStart, new Date(overlappingStart.getTime() + HOUR_IN_MS)),
    ).toBe(true);
    expect(
      await repository.existsOverlapping(professionalId, scheduling.endsAt, new Date(scheduling.endsAt.getTime() + HOUR_IN_MS)),
    ).toBe(false);
    expect(await repository.existsOverlapping(randomUUID(), scheduling.startsAt, scheduling.endsAt)).toBe(false);
  });

  it('a constraint EXCL_schedulings_no_overlap rejeita sobreposição no banco e o adaptador traduz para SchedulingConflictException', async () => {
    const professionalId = randomUUID();
    const first = buildScheduling({ professionalId });
    createdIds.push(first.schedulingId);
    await repository.save(first);

    const overlapping = buildScheduling({ professionalId, startsAt: first.startsAt, endsAt: first.endsAt });
    createdIds.push(overlapping.schedulingId);

    // Grava direto pelo adaptador (sem a checagem existsOverlapping do Service): quem barra é o PostgreSQL (23P01).
    await expect(repository.save(overlapping)).rejects.toBeInstanceOf(SchedulingConflictException);

    const [{ count }] = (await dataSource.query(
      'SELECT count(*)::int AS count FROM scheduling.schedulings WHERE "professionalId" = $1',
      [professionalId],
    )) as { count: number }[];
    expect(count).toBe(1);
  });
});
```

### Cenário obrigatório de 11 passos

| Passo | Onde |
| --- | --- |
| 1. DataSource seguro | `readTestDatabaseConfig()` + `createTestDataSource()` |
| 2. Inicializar | `dataSource.initialize()` |
| 3. Identidade (`current_database`, `current_user`) | `assertTestDatabaseIdentity()` + teste 1 |
| 4. Parâmetros de ambiente/porta | Teste 1: `dataSource.options` com host, porta e banco de `TEST_DB_*`; `inet_server_port()` só `> 0` |
| 5. Migrations | `runMigrations({ transaction: 'each' })` + teste 1 (`showMigrations() === false`, histórico com a classe) |
| 6. Adaptador real | `new TypeOrmSchedulingRepository(dataSource.getRepository(SchedulingEntity))` |
| 7. Entidade de domínio válida | `Scheduling.request({...})` com UUIDs novos |
| 8. `save` | `await repository.save(scheduling)` |
| 9. Consulta direta | `dataSource.query('SELECT ... WHERE "schedulingId" = $1')` |
| 10. Atributos coincidem | `expect(rows[0]).toEqual({...})` |
| 11. Encerramento | `afterAll` com `destroy()` em `finally` |

Cenários adicionais: `findScheduleById` (mapper `toDomain`), `existsOverlapping` (sobreposto, adjacente, outro prestador) e a **constraint `EXCL_schedulings_no_overlap`** rejeitando sobreposição gravada direto pelo adaptador. O PostgreSQL devolve `23P01`, e o adaptador traduz para `SchedulingConflictException`. A INV-1 fica protegida também no nível do banco.

## 4. Execuções reais (17/11/2026, branch `feature/13-persistencia-postgresql`)

### 4.1 Primeira execução (aplica a migration em `conecta_test`)

```text
$ pnpm test:integration --reporter=verbose
 ✓ ... > conecta no banco e com o usuário de testes esperados, com a migration aplicada 5ms
 ✓ ... > save() grava o agendamento e o registro no banco coincide com a entidade de domínio 13ms
 ✓ ... > findScheduleById() reconstrói a entidade de domínio a partir do banco 8ms
 ✓ ... > existsOverlapping() detecta sobreposição do mesmo prestador e ignora intervalos adjacentes 8ms
 ✓ ... > a constraint EXCL_schedulings_no_overlap rejeita sobreposição no banco e o adaptador traduz para SchedulingConflictException 9ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  915ms
```

### 4.2 Estado de `conecta_test` após a execução

```text
$ docker exec -i conecta-postgres psql -U conecta_user -d conecta_test -c 'SELECT * FROM public.migrations;'
 id |   timestamp   |              name
----+---------------+--------------------------------
  1 | 1793060000000 | CreateSchedulings1793060000000

 owner tabela: conecta_test_user
 linhas: 0
 constraints: EXCL_schedulings_no_overlap, PK_schedulings_schedulingId
```

`linhas: 0` confirma que a limpeza restrita aos IDs do teste funcionou.

### 4.3 Segunda execução (idempotência, migration já aplicada)

```text
$ pnpm test:integration
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### 4.4 Travas de segurança

```text
$ TEST_DB_NAME=conecta_dev pnpm test:integration
Error: TEST_DB_NAME="conecta_dev" recusado: o banco de testes deve terminar com "_test".
      Tests  5 skipped (5)

$ TEST_DB_USERNAME=conecta_user TEST_DB_NAME=x_test pnpm test:integration
Error: TEST_DB_USERNAME é igual a DB_USERNAME: use um usuário exclusivo de testes.
      Tests  5 skipped (5)
```

Nas duas situações, nenhuma conexão é aberta: o erro ocorre antes de `initialize()`. `conecta_dev` continuou com 1 registro (o da evidência de durabilidade).

### 4.5 Regressão completa

```text
Nível A (requestScheduling)            Tests  4 passed (4)
Nível B (HTTP com Service mock)        Tests  2 passed (2)
Integrado em memória (Material 08)     Tests  8 passed (8)

$ pnpm test               Test Files  6 passed (6) | Tests 21 passed (21)
$ pnpm test:integration   Test Files  1 passed (1) | Tests  5 passed (5)
$ pnpm test:e2e           Test Files  2 passed (2) | Tests  3 passed (3)
$ pnpm build              nest build (sem erros)
$ pnpm lint               1 warning preexistente (scheduling.repository.interface.ts:6)
```

| Suíte | Linha de base (09-01) | Agora |
| --- | --- | --- |
| `pnpm test` | 21/21 (6 arquivos) | 21/21 (6 arquivos), inalterada e sem banco |
| `pnpm test:integration` | não existia | **5/5** (1 arquivo) |
| `pnpm test:e2e` | 3/3 (contra `conecta_db`) | 3/3 (contra `conecta_dev` migrado) |

Sem regressões. Nenhum teste anterior foi alterado.

## 5. Diagnóstico estruturado (Fase 10)

| # | Sintoma | Evidência | Componente | Causa raiz | Correção | Verificação |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Migration ausente e constraint de INV-1 inexistente no banco legado | `conecta_db` sem `migrations`, sem `btree_gist`, só `PK_798799b02c23c20fa2df0ba37fe` | `AppModule` (`synchronize: true`) | Schema criado pelo `synchronize`, sem migrations | `synchronize: false`; migration aplicada em `conecta_dev`/`conecta_test` | `\d`, `pg_constraint`, `migration:show [X]` |
| 2 | Drift entidade × migration | `migration:generate --dryrun` → `DROP CONSTRAINT "EXCL_schedulings_no_overlap"` | `SchedulingEntity` | Constraint não declarada na entidade | `@Exclusion(...)` + `primaryKeyConstraintName` | Novo dry-run: "No changes in database schema were found" |
| 3 | Consulta SQL falhou (Material 08) | `relation "scheduling" does not exist`; `column "scheduling_id" does not exist` | Consulta manual | Nome real é `scheduling.schedulings`, com colunas camelCase | Consulta corrigida com aspas | Linha retornada (08-04) |

Nenhuma operação destrutiva foi usada como correção (sem `DROP`, `TRUNCATE`, `migration:revert` ou `docker compose down -v`).

## 6. Pendências

- O E2E continua usando o banco do `.env` (desenvolvimento). Apontá-lo para o banco de testes fica como sugestão para a SUB-06.
- Sem CI no repositório: as evidências são locais.
