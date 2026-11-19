import type { RequestSchedulingResponseDto } from '../dtos/confirm-schedule-response.dto.js';

export interface SchedulingResponseSource {
    schedulingId: string;
    customerId: string;
    serviceId: string;
    professionalId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    message: string;
}

export function toRequestSchedulingResponse(
    scheduling: SchedulingResponseSource,
): RequestSchedulingResponseDto {
    return {
        schedulingId: scheduling.schedulingId,
        customerId: scheduling.customerId,
        serviceId: scheduling.serviceId,
        professionalId: scheduling.professionalId,
        startsAt: scheduling.startsAt,
        endsAt: scheduling.endsAt,
        status: scheduling.status,
        message: scheduling.message,
    };
}
