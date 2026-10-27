import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulingService } from './scheduling.service.js';
import { SCHEDULING_REPOSITORY } from '../repositories/scheduling.repository.interface.js';
import { SERVICE_CATALOG } from '../ports/service-catalog.interface.js';
import { Scheduling } from '../entities/scheduling.entity.js';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';
import { SchedulingTooSoonException } from '../../../common/exceptions/scheduling-too-soon.exception.js';
import { SchedulingConflictException } from '../../../common/exceptions/scheduling-conflict.exception.js';
import { CatalogServiceNotFoundException } from '../../../common/exceptions/catalog-service-not-found.exception.js';

const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

const CUSTOMER_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const PROFESSIONAL_ID = '44444444-4444-4444-8444-444444444444';

const buildInput = (hoursAhead: number) => ({
    customerId: CUSTOMER_ID,
    serviceId: SERVICE_ID,
    professionalId: PROFESSIONAL_ID,
    startsAt: new Date(Date.now() + hoursAhead * HOUR_IN_MS),
});

describe('SchedulingService.requestScheduling (UC01)', () => {
    let service: SchedulingService;
    let repository: {
        findScheduleById: ReturnType<typeof vi.fn>;
        existsOverlapping: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
    };
    let catalog: { findById: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SchedulingService,
                {
                    provide: SCHEDULING_REPOSITORY,
                    useValue: {
                        findScheduleById: vi.fn(),
                        existsOverlapping: vi.fn().mockResolvedValue(false),
                        save: vi.fn().mockImplementation(async (s: Scheduling) => s),
                    },
                },
                {
                    provide: SERVICE_CATALOG,
                    useValue: {
                        findById: vi.fn().mockResolvedValue({
                            serviceId: SERVICE_ID,
                            durationInMinutes: 60,
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get(SchedulingService);
        repository = module.get(SCHEDULING_REPOSITORY);
        catalog = module.get(SERVICE_CATALOG);
    });

    it('should throw CatalogServiceNotFoundException when the service is not in the catalog', async () => {
        catalog.findById.mockResolvedValue(null);

        await expect(service.requestScheduling(buildInput(48))).rejects.toThrow(CatalogServiceNotFoundException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw SchedulingTooSoonException when the start is less than 24h ahead (RN01)', async () => {
        await expect(service.requestScheduling(buildInput(23))).rejects.toThrow(SchedulingTooSoonException);
        expect(repository.existsOverlapping).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw SchedulingConflictException when the professional has an overlapping scheduling (INV-1)', async () => {
        repository.existsOverlapping.mockResolvedValue(true);

        await expect(service.requestScheduling(buildInput(48))).rejects.toThrow(SchedulingConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('should persist a PENDING scheduling and return its data', async () => {
        const input = buildInput(48);
        const expectedEndsAt = new Date(input.startsAt.getTime() + 60 * MINUTE_IN_MS);

        const response = await service.requestScheduling(input);

        expect(repository.existsOverlapping).toHaveBeenCalledWith(PROFESSIONAL_ID, input.startsAt, expectedEndsAt);
        expect(repository.save).toHaveBeenCalledTimes(1);
        expect(repository.save.mock.calls[0][0]).toBeInstanceOf(Scheduling);
        expect(response.status).toBe(SchedulingStatus.PENDING);
        expect(response.schedulingId).toEqual(expect.any(String));
        expect(response.endsAt).toEqual(expectedEndsAt);
    });
});
