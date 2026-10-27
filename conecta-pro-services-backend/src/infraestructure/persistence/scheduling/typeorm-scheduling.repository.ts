import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import type { ISchedulingRepository } from '../../../modules/scheduling/repositories/scheduling.repository.interface.js';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';
import { SchedulingConflictException } from '../../../common/exceptions/scheduling-conflict.exception.js';
import { SchedulingEntity } from './scheduling.orm-entity.js';
import { SchedulingOrmMapper } from './scheduling.orm-mapper.js';

const EXCLUSION_VIOLATION = '23P01';

@Injectable()
export class TypeOrmSchedulingRepository implements ISchedulingRepository {
    constructor(
        @InjectRepository(SchedulingEntity)
        private readonly repository: Repository<SchedulingEntity>,
    ) {}

    async findScheduleById(id: string): Promise<Scheduling | null> {
        const entity = await this.repository.findOne({
            where: { schedulingId: id },
        });

        if (!entity) {
            return null;
        }

        return SchedulingOrmMapper.toDomain(entity);
    }

    async existsOverlapping(professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
        return this.repository.exists({
            where: {
                professionalId,
                status: In([SchedulingStatus.PENDING, SchedulingStatus.CONFIRMED]),
                startsAt: LessThan(endsAt),
                endsAt: MoreThan(startsAt),
            },
        });
    }

    async save(scheduling: Scheduling): Promise<Scheduling> {
        const entity = SchedulingOrmMapper.toPersistence(scheduling);

        try {
            const savedEntity = await this.repository.save(entity);
            return SchedulingOrmMapper.toDomain(savedEntity);
        } catch (error) {
            if (this.isExclusionViolation(error)) {
                throw new SchedulingConflictException();
            }
            throw error;
        }
    }

    private isExclusionViolation(error: unknown): boolean {
        const candidate = error as { code?: string; driverError?: { code?: string } };
        return (candidate?.driverError?.code ?? candidate?.code) === EXCLUSION_VIOLATION;
    }
}