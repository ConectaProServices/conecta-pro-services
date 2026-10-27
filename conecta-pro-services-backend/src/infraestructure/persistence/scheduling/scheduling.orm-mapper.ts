import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import { SchedulingEntity } from './scheduling.orm-entity.js';

export class SchedulingOrmMapper {
    static toDomain(entity: SchedulingEntity): Scheduling {
        return new Scheduling(
            entity.schedulingId,
            entity.customerId,
            entity.serviceId,
            entity.professionalId,
            entity.startsAt,
            entity.endsAt,
            entity.status,
            entity.createdAt,
            entity.updatedAt,
            entity.deletedAt ?? null,
        );
    }

    static toPersistence(scheduling: Scheduling): SchedulingEntity {
        const entity = new SchedulingEntity();
        entity.schedulingId = scheduling.schedulingId;
        entity.customerId = scheduling.customerId;
        entity.serviceId = scheduling.serviceId;
        entity.professionalId = scheduling.professionalId;
        entity.startsAt = scheduling.startsAt;
        entity.endsAt = scheduling.endsAt;
        entity.status = scheduling.getStatus();
        entity.createdAt = scheduling.createdAt;
        entity.updatedAt = scheduling.updatedAt;
        entity.deletedAt = scheduling.deletedAt;
        return entity;
    }
}
