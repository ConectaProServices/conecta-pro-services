import { Inject, Injectable } from "@nestjs/common";
import { SchedulingAlreadyConfirmedException } from "../../../exceptions/scheduling-already-confirmed.exception.js";
import { SchedulingStatus } from "../../../enum/scheduling-status.enum.js";
import { SchedulingNotFoundException } from "../../../exceptions/scheduling-not-found-exception.js";
import { SCHEDULING_REPOSITORY, type ISchedulingRepository} from "../repositories/scheduling.repository.interface.js";

@Injectable()
export class SchedulingService {
    constructor(
        @Inject(SCHEDULING_REPOSITORY)
        private readonly schedulingRepository: ISchedulingRepository,
    ) {}
    async confirmScheduling(schedulingId: string): Promise<any> {
        const scheduling = await this.schedulingRepository.findScheduleById(schedulingId);
        
        if (!scheduling) {
            throw new SchedulingNotFoundException();
        }

        if (scheduling.status === SchedulingStatus.CONFIRMED) {
            throw new SchedulingAlreadyConfirmedException();
        }
    }
}
