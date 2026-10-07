export class ConfirmScheduleResponseDto {
    public readonly schedulingId: string;
    public readonly customerId: string;
    public readonly serviceId: string;
    public readonly professionalId: string;
    public readonly status: string;
    public readonly updatedAt: Date;
    public readonly message: string;
}
