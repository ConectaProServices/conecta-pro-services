import { SchedulingStatus } from "../../../common/enum/scheduling-status.enum.js";
import { SchedulingAlreadyConfirmedException } from "../../../common/exceptions/scheduling-already-confirmed.exception.js";
import { SchedulingTooSoonException } from "../../../common/exceptions/scheduling-too-soon.exception.js";

const MIN_NOTICE_IN_MS = 24 * 60 * 60 * 1000;

export interface RequestSchedulingProps {
    schedulingId: string;
    customerId: string;
    serviceId: string;
    professionalId: string;
    startsAt: Date;
    endsAt: Date;
}

export class Scheduling {
    private status: SchedulingStatus;

    constructor(
        public readonly schedulingId: string,
        public readonly customerId: string,
        public readonly serviceId: string,
        public readonly professionalId: string,
        public readonly startsAt: Date,
        public readonly endsAt: Date,
        status: SchedulingStatus,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
        public readonly deletedAt: Date | null = null,
    ) {
        this.status = status ?? SchedulingStatus.PENDING;
    }

    public static request(props: RequestSchedulingProps, now: Date = new Date()): Scheduling {
        if (props.startsAt.getTime() - now.getTime() < MIN_NOTICE_IN_MS) {
            throw new SchedulingTooSoonException();
        }

        return new Scheduling(
            props.schedulingId,
            props.customerId,
            props.serviceId,
            props.professionalId,
            props.startsAt,
            props.endsAt,
            SchedulingStatus.PENDING,
        );
    }

    public getStatus(): SchedulingStatus {
        return this.status;
    }

    public confirmScheduling(): void {
        if (this.status === SchedulingStatus.CONFIRMED) {
            throw new SchedulingAlreadyConfirmedException();
        }
        this.status = SchedulingStatus.CONFIRMED;
    }
}
