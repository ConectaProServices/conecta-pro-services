import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { SchedulingEntity } from '../../src/infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { SchedulingStatus } from '../../src/common/enum/scheduling-status.enum.js';
import { DomainHttpExceptionFilter } from '../../src/common/filters/domain-http-exception.filter.js';

// ID do serviço válido cadastrado no InMemoryServiceCatalog
const DEMO_SERVICE_ID = '33333333-3333-4333-8333-333333333333';

describe('POST /schedulings (e2e)', () => {
  let app: INestApplication;
  let schedulingRepository: Repository<SchedulingEntity>;
  const createdSchedulingIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 1. Habilita a transformação global de DTOs (converte strings ISO para Date com @Type(() => Date))
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // 2. Aplica o filtro de exceções de domínio no ambiente de teste E2E
    app.useGlobalFilters(new DomainHttpExceptionFilter());

    await app.init();

    schedulingRepository = app.get(getRepositoryToken(SchedulingEntity));
  });

  afterAll(async () => {
    if (createdSchedulingIds.length > 0) {
      await schedulingRepository.delete(createdSchedulingIds); // Limpeza dos registros de teste
    }
    await app.close();
  });

  it('deve solicitar agendamento com sucesso e persistir como PENDING (201)', async () => {
    const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h no futuro (cumpre RN01)
    const payload = {
      customerId: randomUUID(),
      serviceId: DEMO_SERVICE_ID,
      professionalId: randomUUID(),
      startsAt: startsAt.toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(payload)
      .expect(HttpStatus.CREATED);

    createdSchedulingIds.push(response.body.schedulingId);

    // Valida a persistência real no PostgreSQL
    const persisted = await schedulingRepository.findOneByOrFail({
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

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send(payload)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.error).toBe('SchedulingTooSoonException');
  });
});