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
