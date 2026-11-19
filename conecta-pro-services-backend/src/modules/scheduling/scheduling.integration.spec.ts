import { HttpStatus, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SchedulingStatus } from '../../common/enum/scheduling-status.enum.js';
import { DomainHttpExceptionFilter } from '../../common/filters/domain-http-exception.filter.js';
import { CustomerDailySchedulingLimitException } from '../../common/exceptions/customer-daily-scheduling-limit.exception.js';
import { SameParticipantSchedulingException } from '../../common/exceptions/same-participant-scheduling.exception.js';
import { DEMO_SERVICE_ID, InMemoryServiceCatalog } from '../../infraestructure/catalog/in-memory-service-catalog.js';
import { InMemorySchedulingRepository } from '../../infraestructure/persistence/scheduling/in-memory-scheduling.repository.js';
import { SchedulingEntity } from '../../infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { SchedulingController } from './controllers/scheduling.controller.js';
import { Scheduling } from './entities/scheduling.entity.js';
import { SERVICE_CATALOG } from './ports/service-catalog.interface.js';
import { SCHEDULING_REPOSITORY, type ISchedulingRepository } from './repositories/scheduling.repository.interface.js';
import { SchedulingModule } from './scheduling.module.js';
import { SchedulingService } from './services/scheduling.service.js';

const HOUR_IN_MS = 60 * 60 * 1000;
const SERVICE_DURATION_IN_MS = 60 * 60 * 1000; // serviço demo do InMemoryServiceCatalog: 60 min

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * HOUR_IN_MS);

const buildPayload = (overrides: Record<string, unknown> = {}) => ({
  customerId: randomUUID(),
  serviceId: DEMO_SERVICE_ID,
  professionalId: randomUUID(),
  startsAt: hoursFromNow(48).toISOString(),
  ...overrides,
});

describe('POST /schedulings — integração do backend (módulo, controller, service e repositório em memória reais)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let repository: ISchedulingRepository;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [SchedulingModule],
    })
      // O SchedulingModule importa TypeOrmModule.forFeature e instancia o TypeOrmSchedulingRepository,
      // que exige um DataSource. Esse adaptador não participa do fluxo testado: recebe um valor inerte.
      .overrideProvider(getRepositoryToken(SchedulingEntity))
      .useValue({})
      // O token do contrato passa a ser resolvido pelo adaptador em memória real.
      .overrideProvider(SCHEDULING_REPOSITORY)
      .useClass(InMemorySchedulingRepository)
      .compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração de fronteira de src/main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainHttpExceptionFilter());
    await app.init();

    repository = moduleRef.get<ISchedulingRepository>(SCHEDULING_REPOSITORY);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app?.close();
  });

  it('resolve os componentes reais pelo contêiner (sem mocks de Service ou Repository)', () => {
    expect(moduleRef.get(SchedulingController)).toBeInstanceOf(SchedulingController);
    expect(moduleRef.get(SchedulingService)).toBeInstanceOf(SchedulingService);
    expect(repository).toBeInstanceOf(InMemorySchedulingRepository);
    expect(moduleRef.get(SERVICE_CATALOG)).toBeInstanceOf(InMemoryServiceCatalog);
  });

  it('cria o agendamento com dados válidos (201) e o armazena no repositório em memória', async () => {
    const payload = buildPayload();

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(payload)
      .expect(HttpStatus.CREATED);

    // Evidência 1 — resposta HTTP produzida pelo fluxo real
    expect(response.body).toMatchObject({
      customerId: payload.customerId,
      serviceId: payload.serviceId,
      professionalId: payload.professionalId,
      startsAt: payload.startsAt,
      endsAt: new Date(new Date(payload.startsAt).getTime() + SERVICE_DURATION_IN_MS).toISOString(),
      status: SchedulingStatus.PENDING,
      message: 'Scheduling requested successfully.',
    });
    expect(response.body.schedulingId).toEqual(expect.any(String));

    // Evidência 2 — estado do repositório, consultado pelo próprio contrato (findScheduleById)
    const stored = await repository.findScheduleById(response.body.schedulingId);
    expect(stored).toBeInstanceOf(Scheduling);
    expect(stored?.getStatus()).toBe(SchedulingStatus.PENDING);
    expect(stored?.customerId).toBe(payload.customerId);
    expect(stored?.professionalId).toBe(payload.professionalId);
    expect(stored?.startsAt.toISOString()).toBe(payload.startsAt);
  });

  it('rejeita payload inválido na fronteira HTTP (400) sem acionar o Service nem gravar no repositório', async () => {
    const serviceSpy = vi.spyOn(moduleRef.get(SchedulingService), 'requestScheduling');
    const saveSpy = vi.spyOn(repository, 'save');

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ customerId: 'nao-e-uuid', startsAt: 'nao-e-data' }))
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toEqual(
      expect.arrayContaining(['customerId must be a UUID', 'startsAt must be a Date instance']),
    );
    expect(serviceSpy).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejeita conflito de agenda do mesmo prestador (409) usando o agendamento já armazenado', async () => {
    const professionalId = randomUUID();
    const startsAt = hoursFromNow(48).toISOString();

    await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ professionalId, startsAt }))
      .expect(HttpStatus.CREATED);

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ professionalId, startsAt }))
      .expect(HttpStatus.CONFLICT);

    expect(response.body.error).toBe('SchedulingConflictException');
  });

  it('rejeita serviço inexistente no catálogo (404) sem gravar no repositório', async () => {
    const saveSpy = vi.spyOn(repository, 'save');

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ serviceId: randomUUID() }))
      .expect(HttpStatus.NOT_FOUND);

    expect(response.body.error).toBe('CatalogServiceNotFoundException');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejeita antecedência menor que 24h (422, RN01) sem gravar no repositório', async () => {
    const saveSpy = vi.spyOn(repository, 'save');

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ startsAt: hoursFromNow(2).toISOString() }))
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.error).toBe('SchedulingTooSoonException');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('retorna 422 para cliente igual ao prestador (RN05)', async () => {
    const sameParticipantId = randomUUID();

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ customerId: sameParticipantId, professionalId: sameParticipantId }))
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: SameParticipantSchedulingException.name,
    });
  });

  it('retorna 409 quando o cliente já tem agendamento ativo na data local (RN03)', async () => {
    const customerId = randomUUID();
    const startsAt = '2030-01-15T23:00:00.000Z';

    await request(app.getHttpServer())
      .post('/schedulings')
      .send(buildPayload({ customerId, startsAt }))
      .expect(HttpStatus.CREATED);

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(
        buildPayload({
          customerId,
          startsAt: '2030-01-16T02:00:00.000Z',
          professionalId: randomUUID(),
        }),
      )
      .expect(HttpStatus.CONFLICT);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      error: CustomerDailySchedulingLimitException.name,
    });

    await request(app.getHttpServer())
      .post('/schedulings')
      .send(
        buildPayload({
          customerId,
          startsAt: '2030-01-16T03:00:00.000Z',
          professionalId: randomUUID(),
        }),
      )
      .expect(HttpStatus.CREATED);
  });
});

describe('Diagnóstico de composição de DI (contexto de teste isolado)', () => {
  it('falha ao compilar quando o provider de SCHEDULING_REPOSITORY é omitido', async () => {
    const compileWithoutRepository = Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        SchedulingService,
        InMemoryServiceCatalog,
        { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
        // provider de SCHEDULING_REPOSITORY omitido de propósito
      ],
    }).compile();

    await expect(compileWithoutRepository).rejects.toThrow(
      "Nest can't resolve dependencies of the SchedulingService (?, Symbol(SERVICE_CATALOG)). " +
        'Please make sure that the argument Symbol(SCHEDULING_REPOSITORY) at index [0] is available in the RootTestModule module.',
    );
  });

  it('compila quando o provider do token é registrado (correção)', async () => {
    const isolated = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        SchedulingService,
        InMemoryServiceCatalog,
        { provide: SERVICE_CATALOG, useExisting: InMemoryServiceCatalog },
        { provide: SCHEDULING_REPOSITORY, useClass: InMemorySchedulingRepository },
      ],
    }).compile();

    expect(isolated.get(SCHEDULING_REPOSITORY)).toBeInstanceOf(InMemorySchedulingRepository);
    await isolated.close();
  });
});
