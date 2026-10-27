import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { SchedulingAlreadyConfirmedException } from "../../../common/exceptions/scheduling-already-confirmed.exception.js";
import { SchedulingStatus } from "../../../common/enum/scheduling-status.enum.js";
import { SchedulingNotFoundException } from "../../../common/exceptions/scheduling-not-found-exception.js";
import { SchedulingConflictException } from "../../../common/exceptions/scheduling-conflict.exception.js";
import { CatalogServiceNotFoundException } from "../../../common/exceptions/catalog-service-not-found.exception.js";
import { SCHEDULING_REPOSITORY, type ISchedulingRepository } from "../repositories/scheduling.repository.interface.js";
import { SERVICE_CATALOG, type IServiceCatalog } from "../ports/service-catalog.interface.js";
import { Scheduling } from "../entities/scheduling.entity.js";
import type { RequestSchedulingDto } from "../dtos/request-scheduling.dto.js";

const MINUTE_IN_MS = 60 * 1000;

@Injectable()
export class SchedulingService {
    constructor(
        @Inject(SCHEDULING_REPOSITORY)
        private readonly schedulingRepository: ISchedulingRepository,
        @Inject(SERVICE_CATALOG)
        private readonly serviceCatalog: IServiceCatalog,
    ) {}

    async requestScheduling(input: RequestSchedulingDto) {
        const serviceSnapshot = await this.serviceCatalog.findById(input.serviceId);
        if (!serviceSnapshot) {
            throw new CatalogServiceNotFoundException();
        }

        const endsAt = new Date(input.startsAt.getTime() + serviceSnapshot.durationInMinutes * MINUTE_IN_MS);

        const scheduling = Scheduling.request({
            schedulingId: randomUUID(),
            customerId: input.customerId,
            serviceId: input.serviceId,
            professionalId: input.professionalId,
            startsAt: input.startsAt,
            endsAt,
        });

        const hasConflict = await this.schedulingRepository.existsOverlapping(
            input.professionalId,
            input.startsAt,
            endsAt,
        );
        if (hasConflict) {
            throw new SchedulingConflictException();
        }

        const saved = await this.schedulingRepository.save(scheduling);

        return {
            schedulingId: saved.schedulingId,
            customerId: saved.customerId,
            serviceId: saved.serviceId,
            professionalId: saved.professionalId,
            startsAt: saved.startsAt,
            endsAt: saved.endsAt,
            status: saved.getStatus(),
            message: 'Scheduling requested successfully.',
        };
    }

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
