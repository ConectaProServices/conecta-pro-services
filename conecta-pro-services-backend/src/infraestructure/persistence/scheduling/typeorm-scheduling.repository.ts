import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { Scheduling } from '../../../modules/scheduling/entities/scheduling.entity.js';
import type { ISchedulingRepository } from '../../../modules/scheduling/repositories/scheduling.repository.interface.js';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';
import { SchedulingConflictException } from '../../../common/exceptions/scheduling-conflict.exception.js';
import { CustomerDailySchedulingLimitException } from '../../../common/exceptions/customer-daily-scheduling-limit.exception.js';
import { SchedulingEntity } from './scheduling.orm-entity.js';
import { SchedulingOrmMapper } from './scheduling.orm-mapper.js';

const EXCLUSION_VIOLATION = '23P01';
const UNIQUE_VIOLATION = '23505';
const CUSTOMER_DAILY_LIMIT_INDEX = 'UQ_schedulings_customer_sao_paulo_date_active';

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

    async existsActiveForCustomerOnDate(customerId: string, startsAt: Date): Promise<boolean> {
        return this.repository
            .createQueryBuilder('scheduling')
            .where('scheduling.customerId = :customerId', { customerId })
            .andWhere('scheduling.status IN (:...activeStatuses)', {
                activeStatuses: [SchedulingStatus.PENDING, SchedulingStatus.CONFIRMED],
            })
            .andWhere('scheduling.deletedAt IS NULL')
            .andWhere(
                `(scheduling.startsAt AT TIME ZONE 'America/Sao_Paulo')::date = ` +
                    `(CAST(:startsAt AS timestamptz) AT TIME ZONE 'America/Sao_Paulo')::date`,
                { startsAt },
            )
            .getExists();
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
            if (this.isCustomerDailyLimitViolation(error)) {
                throw new CustomerDailySchedulingLimitException();
            }
            throw error;
        }
    }

    private isExclusionViolation(error: unknown): boolean {
        const candidate = error as { code?: string; driverError?: { code?: string } };
        return (candidate?.driverError?.code ?? candidate?.code) === EXCLUSION_VIOLATION;
    }

    private isCustomerDailyLimitViolation(error: unknown): boolean {
        const candidate = error as {
            code?: string;
            constraint?: string;
            driverError?: { code?: string; constraint?: string };
        };
        const driverError = candidate?.driverError;
        return (
            (driverError?.code ?? candidate?.code) === UNIQUE_VIOLATION &&
            (driverError?.constraint ?? candidate?.constraint) === CUSTOMER_DAILY_LIMIT_INDEX
        );
    }
}