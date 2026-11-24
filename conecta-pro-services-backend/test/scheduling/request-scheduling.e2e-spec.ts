import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { SchedulingEntity } from '../../src/infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { SchedulingStatus } from '../../src/common/enum/scheduling-status.enum.js';
import { DomainHttpExceptionFilter } from '../../src/common/filters/domain-http-exception.filter.js';
import {
  assertTestDatabaseIdentity,
  createTestDataSource,
  readTestDatabaseConfig,
} from '../helpers/test-data-source.js';

// ID do serviço válido cadastrado no InMemoryServiceCatalog
const DEMO_SERVICE_ID = '33333333-3333-4333-8333-333333333333';

describe('POST /schedulings (e2e)', () => {
  let app: INestApplication | undefined;
  let schedulingRepository: Repository<SchedulingEntity> | undefined;
  const createdSchedulingIds: string[] = [];

  const getHttpServer = () => {
    if (!app) {
      throw new Error('Aplicação E2E não foi inicializada.');
    }
    return app.getHttpServer();
  };

  const getSchedulingRepository = () => {
    if (!schedulingRepository) {
      throw new Error('Repositório E2E não foi inicializado.');
    }
    return schedulingRepository;
  };

  beforeAll(async () => {
    const testDatabaseConfig = readTestDatabaseConfig();
    process.env.DB_HOST = testDatabaseConfig.host;
    process.env.DB_PORT = String(testDatabaseConfig.port);
    process.env.DB_USERNAME = testDatabaseConfig.username;
    process.env.DB_PASSWORD = testDatabaseConfig.password;
    process.env.DB_NAME = testDatabaseConfig.database;

    const migrationDataSource = createTestDataSource(testDatabaseConfig);
    try {
      await migrationDataSource.initialize();
      await assertTestDatabaseIdentity(migrationDataSource, testDatabaseConfig);
      await migrationDataSource.runMigrations({ transaction: 'each' });
    } finally {
      if (migrationDataSource.isInitialized) {
        await migrationDataSource.destroy();
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 1. Habilita a transformação global de DTOs (converte strings ISO para Date com @Type(() => Date))
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // 2. Aplica o filtro de exceções de domínio no ambiente de teste E2E
    app.useGlobalFilters(new DomainHttpExceptionFilter());

    await app.init();

    await assertTestDatabaseIdentity(app.get(DataSource), testDatabaseConfig);
    schedulingRepository = app.get(getRepositoryToken(SchedulingEntity));
  });

  afterAll(async () => {
    try {
      if (createdSchedulingIds.length > 0 && schedulingRepository) {
        await schedulingRepository.delete(createdSchedulingIds);
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  it('deve solicitar agendamento com sucesso e persistir como PENDING (201)', async () => {
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h no futuro (cumpre RN01)
    const payload = {
      customerId: randomUUID(),
      serviceId: DEMO_SERVICE_ID,
      professionalId: randomUUID(),
      startsAt: startsAt.toISOString(),
    };

    const response = await request(getHttpServer())
      .post('/schedulings')
      .send(payload)
      .expect(HttpStatus.CREATED);

    createdSchedulingIds.push(response.body.schedulingId);

    // Valida a persistência real no PostgreSQL
    const persisted = await getSchedulingRepository().findOneByOrFail({
      schedulingId: response.body.schedulingId,
    });

    expect(persisted.status).toBe(SchedulingStatus.PENDING);
    expect(persisted.professionalId).toBe(payload.professionalId);
  });

  it('deve retornar 422 Unprocessable Entity se violar a antecedência de 24h (RN01)', async () => {
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // Apenas 2h no futuro (viola RN01)
    const payload = {
      customerId: randomUUID(),
      serviceId: DEMO_SERVICE_ID,
      professionalId: randomUUID(),
      startsAt: startsAt.toISOString(),
    };

    const response = await request(getHttpServer())
      .post('/schedulings')
      .send(payload)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.error).toBe('SchedulingTooSoonException');
  });

  it('deve retornar 404 se o serviço não existir no catálogo', async () => {
    const response = await request(getHttpServer())
      .post('/schedulings')
      .send({
        customerId: randomUUID(),
        serviceId: randomUUID(),
        professionalId: randomUUID(),
        startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(HttpStatus.NOT_FOUND);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'CatalogServiceNotFoundException',
    });
  });

  it('deve retornar 409 quando o prestador já possui agendamento sobreposto', async () => {
    const professionalId = randomUUID();
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const first = await request(getHttpServer())
      .post('/schedulings')
      .send({
        customerId: randomUUID(),
        serviceId: DEMO_SERVICE_ID,
        professionalId,
        startsAt,
      })
      .expect(HttpStatus.CREATED);
    createdSchedulingIds.push(first.body.schedulingId);

    const response = await request(getHttpServer())
      .post('/schedulings')
      .send({
        customerId: randomUUID(),
        serviceId: DEMO_SERVICE_ID,
        professionalId,
        startsAt,
      })
      .expect(HttpStatus.CONFLICT);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      error: 'SchedulingConflictException',
    });
  });

  it('deve retornar 409 quando o cliente já tem agendamento ativo na data (RN03)', async () => {
    const customerId = randomUUID();
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const first = await request(getHttpServer())
      .post('/schedulings')
      .send({
        customerId,
        serviceId: DEMO_SERVICE_ID,
        professionalId: randomUUID(),
        startsAt,
      })
      .expect(HttpStatus.CREATED);
    createdSchedulingIds.push(first.body.schedulingId);

    const response = await request(getHttpServer())
      .post('/schedulings')
      .send({
        customerId,
        serviceId: DEMO_SERVICE_ID,
        professionalId: randomUUID(),
        startsAt,
      })
      .expect(HttpStatus.CONFLICT);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      error: 'CustomerDailySchedulingLimitException',
    });
  });

  it('deve retornar 422 quando cliente e prestador forem a mesma pessoa (RN05)', async () => {
    const participantId = randomUUID();
    const response = await request(getHttpServer())
      .post('/schedulings')
      .send({
        customerId: participantId,
        serviceId: DEMO_SERVICE_ID,
        professionalId: participantId,
        startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'SameParticipantSchedulingException',
    });
  });
});