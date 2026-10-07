import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingService } from "./scheduling.service.js";
import { SchedulingNotFoundException } from "../../../exceptions/scheduling-not-found-exception.js";
import { SCHEDULING_REPOSITORY } from "../repositories/scheduling.repository.interface.js";
import { SchedulingStatus } from "../../../enum/scheduling-status.enum.js";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulingAlreadyConfirmedException } from '../../../exceptions/scheduling-already-confirmed.exception.js';

const SCHEDULE_ID = '1';

describe('SchedulingService', () => {
    let schedulingService: SchedulingService;
    let schedulingRepository: {
        findScheduleById: ReturnType<typeof vi.fn>;
    }

    beforeEach(async () => {
        const schedulingRepositoryMock = {
            findScheduleById: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SchedulingService,
                {
                    provide: SCHEDULING_REPOSITORY,
                    useValue: schedulingRepositoryMock,
                },
            ],
        }).compile();

        schedulingService = module.get<SchedulingService>(SchedulingService);
        schedulingRepository = module.get(SCHEDULING_REPOSITORY);
    });

    it('should throw SchedulingNotFoundException when scheduling is not found', async () => {
        schedulingRepository.findScheduleById.mockResolvedValue(null);

        await expect(schedulingService.confirmScheduling(SCHEDULE_ID)).rejects.toThrow(SchedulingNotFoundException);
    });

    it('should fail when schedule is already confirmed', async () => {
        schedulingRepository.findScheduleById.mockResolvedValue({
            schedulingId: SCHEDULE_ID,
            status: SchedulingStatus.CONFIRMED,
        });

        await expect(schedulingService.confirmScheduling(SCHEDULE_ID)).rejects.toThrow(SchedulingAlreadyConfirmedException);
    });
});
