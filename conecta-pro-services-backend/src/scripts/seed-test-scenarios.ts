import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module.js';
import { SchedulingEntity } from '../infraestructure/persistence/scheduling/scheduling.orm-entity.js';
import { SchedulingStatus } from '../common/enum/scheduling-status.enum.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const schedulingRepository = app.get<Repository<SchedulingEntity>>(getRepositoryToken(SchedulingEntity));

  console.log('Preparando cenários de teste E2E...');

  const professionalId = randomUUID();
  const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Daqui a 48h
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000); 

  // Cria um agendamento direto na tabela para bloquear a agenda do profissional
  const conflictScheduling = schedulingRepository.create({
    schedulingId: randomUUID(),
    customerId: randomUUID(),
    serviceId: randomUUID(),
    professionalId: professionalId,
    startsAt: startsAt,
    endsAt: endsAt,
    status: SchedulingStatus.CONFIRMED,
  });

  await schedulingRepository.save(conflictScheduling);
  console.log(`[SUCESSO] Profissional OCUPADO gerado: ${professionalId}`);

  await app.close();
}

bootstrap().catch(console.error);