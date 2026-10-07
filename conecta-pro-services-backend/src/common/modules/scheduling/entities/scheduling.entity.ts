import { SchedulingStatus } from "../../../enum/scheduling-status.enum.js";
import { SchedulingAlreadyConfirmedException } from "../../../exceptions/scheduling-already-confirmed.exception.js";

export class Scheduling {
    private status: SchedulingStatus;

    constructor(
        public readonly schedulingId: string,
        public readonly customerId: string,
        public readonly serviceId: string,
        public readonly professionalId: string,
        status: SchedulingStatus,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
        public readonly deletedAt: Date | null = null,
    ) {
        this.status = status ?? SchedulingStatus.PENDING;
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