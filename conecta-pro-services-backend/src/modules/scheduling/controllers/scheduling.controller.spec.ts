import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainHttpExceptionFilter } from '../../../common/filters/domain-http-exception.filter.js';
import { SchedulingService } from '../services/scheduling.service.js';
import { SchedulingController } from './scheduling.controller.js';

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const SCHEDULING_ID = '44444444-4444-4444-8444-444444444444';
const STARTS_AT = '2026-12-01T13:00:00.000Z';
const ENDS_AT = '2026-12-01T14:00:00.000Z';

describe('POST /schedulings (fronteira HTTP com serviço mockado)', () => {
  let app: INestApplication;
  const schedulingServiceMock = { requestScheduling: vi.fn() };

  beforeEach(async () => {
    schedulingServiceMock.requestScheduling.mockReset();

    const moduleRef = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [{ provide: SchedulingService, useValue: schedulingServiceMock }],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração de fronteira usada em src/main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainHttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('retorna 201 e delega ao SchedulingService.requestScheduling com payload válido', async () => {
    schedulingServiceMock.requestScheduling.mockResolvedValue({
      schedulingId: SCHEDULING_ID,
      customerId: CUSTOMER_ID,
      serviceId: SERVICE_ID,
      professionalId: PROFESSIONAL_ID,
      startsAt: new Date(STARTS_AT),
      endsAt: new Date(ENDS_AT),
      status: 'PENDING',
      message: 'Scheduling requested successfully.',
    });

    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send({
        customerId: CUSTOMER_ID,
        serviceId: SERVICE_ID,
        professionalId: PROFESSIONAL_ID,
        startsAt: STARTS_AT,
        unexpectedField: 'deve ser removido pelo whitelist',
      })
      .expect(HttpStatus.CREATED);

    expect(schedulingServiceMock.requestScheduling).toHaveBeenCalledTimes(1);
    const [input] = schedulingServiceMock.requestScheduling.mock.calls[0];
    expect(input).toEqual({
      customerId: CUSTOMER_ID,
      serviceId: SERVICE_ID,
      professionalId: PROFESSIONAL_ID,
      startsAt: new Date(STARTS_AT),
    });
    expect(input.startsAt).toBeInstanceOf(Date);
    expect(input).not.toHaveProperty('unexpectedField');

    expect(response.body).toEqual({
      schedulingId: SCHEDULING_ID,
      customerId: CUSTOMER_ID,
      serviceId: SERVICE_ID,
      professionalId: PROFESSIONAL_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      status: 'PENDING',
      message: 'Scheduling requested successfully.',
    });
  });

  it('retorna 400 e não chama o serviço quando o payload viola o DTO', async () => {
    const response = await request(app.getHttpServer())
      .post('/schedulings')
      .send({
        customerId: 'nao-e-uuid',
        serviceId: '',
        professionalId: PROFESSIONAL_ID,
        startsAt: 'nao-e-data',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'customerId must be a UUID',
        'serviceId should not be empty',
        'serviceId must be a UUID',
        'startsAt must be a Date instance',
      ]),
    );
    expect(schedulingServiceMock.requestScheduling).not.toHaveBeenCalled();
  });
});
