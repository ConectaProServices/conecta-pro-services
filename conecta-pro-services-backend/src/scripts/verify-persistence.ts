import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SchedulingStatus } from '../common/enum/scheduling-status.enum.js';
import { SchedulingConflictException } from '../common/exceptions/scheduling-conflict.exception.js';
import { SchedulingTooSoonException } from '../common/exceptions/scheduling-too-soon.exception.js';
import { SchedulingService } from '../modules/scheduling/services/scheduling.service.js';
import { TypeOrmSchedulingRepository } from '../infraestructure/persistence/scheduling/typeorm-scheduling.repository.js';
import { DEMO_SERVICE_ID } from '../infraestructure/catalog/in-memory-service-catalog.js';
import { Scheduling } from '../modules/scheduling/entities/scheduling.entity.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

    try {
        const service = app.get(SchedulingService);
        const repository = app.get(TypeOrmSchedulingRepository);

        const customerId = randomUUID();
        const professionalId = randomUUID();
        const startsAt = new Date(Date.now() + 48 * HOUR);

        // 1. UC01 pelo fluxo de aplicação, com banco real
        const created = await service.requestScheduling({
            customerId,
            serviceId: DEMO_SERVICE_ID,
            professionalId,
            startsAt,
        });
        console.log('1. Agendamento criado:', created.schedulingId, '| status:', created.status);
        assert.equal(created.status, SchedulingStatus.PENDING);

        // 2. Leitura real: o mapper reconstrói a entidade de domínio
        const found = await repository.findScheduleById(created.schedulingId);
        assert.ok(found, 'agendamento deveria existir no banco');
        console.log('2. Recuperado do banco:', found.schedulingId, '| status:', found.getStatus());
        assert.equal(found.getStatus(), SchedulingStatus.PENDING);

        // 3. INV-1 pelo service (existsOverlapping)
        await assert.rejects(
            () => service.requestScheduling({
                customerId,
                serviceId: DEMO_SERVICE_ID,
                professionalId,
                startsAt: new Date(startsAt.getTime() + 30 * MINUTE),
            }),
            SchedulingConflictException,
        );
        console.log('3. INV-1 (service): sobreposição rejeitada.');

        // 4. RN01 (24h)
        await assert.rejects(
            () => service.requestScheduling({
                customerId,
                serviceId: DEMO_SERVICE_ID,
                professionalId: randomUUID(),
                startsAt: new Date(Date.now() + 2 * HOUR),
            }),
            SchedulingTooSoonException,
        );
        console.log('4. RN01: solicitação com menos de 24h rejeitada.');

        // 5. Registro inexistente
        assert.equal(await repository.findScheduleById(randomUUID()), null);
        console.log('5. Registro inexistente retorna null.');

        // 6. INV-1 no banco: ignora o existsOverlapping e salva direto
        const overlapping = Scheduling.request({
            schedulingId: randomUUID(),
            customerId,
            serviceId: DEMO_SERVICE_ID,
            professionalId,
            startsAt,
            endsAt: new Date(startsAt.getTime() + HOUR),
        });
        await assert.rejects(() => repository.save(overlapping), SchedulingConflictException);
        console.log('6. INV-1 (constraint do banco): conflito barrado.');

        console.log('\nPersistência verificada com sucesso.');
    } finally {
        await app.close();
    }
}

bootstrap().catch((error) => {
    console.error('Falha na verificação:', error);
    process.exitCode = 1;
});
