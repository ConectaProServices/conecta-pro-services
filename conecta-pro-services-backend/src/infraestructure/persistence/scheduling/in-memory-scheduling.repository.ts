import { Injectable } from '@nestjs/common';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';
import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import type { ISchedulingRepository } from '../../../modules/scheduling/repositories/scheduling.repository.interface.js';

const ACTIVE_STATUSES = [SchedulingStatus.PENDING, SchedulingStatus.CONFIRMED];

/**
 * Adaptador em memória do contrato ISchedulingRepository.
 * Uso: testes integrados do backend (Material 08). Não é a persistência definitiva:
 * o provider de produção do SchedulingModule continua sendo TypeOrmSchedulingRepository.
 */
@Injectable()
export class InMemorySchedulingRepository implements ISchedulingRepository {
    private readonly schedulings = new Map<string, Scheduling>();

    async findScheduleById(id: string): Promise<Scheduling | null> {
        return this.schedulings.get(id) ?? null;
    }

    async existsOverlapping(professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
        for (const scheduling of this.schedulings.values()) {
            if (
                scheduling.professionalId === professionalId &&
                ACTIVE_STATUSES.includes(scheduling.getStatus()) &&
                scheduling.startsAt < endsAt &&
                scheduling.endsAt > startsAt
            ) {
                return true;
            }
        }
        return false;
    }

    async save(scheduling: Scheduling): Promise<Scheduling> {
        this.schedulings.set(scheduling.schedulingId, scheduling);
        return scheduling;
    }
}
