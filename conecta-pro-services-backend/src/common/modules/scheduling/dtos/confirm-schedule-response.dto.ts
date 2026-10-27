export class RequestSchedulingResponseDto {
    public readonly schedulingId: string;
    public readonly customerId: string;
    public readonly serviceId: string;
    public readonly professionalId: string;
    public readonly startsAt: Date;
    public readonly endsAt: Date;
    public readonly status: string;
    public readonly message: string;
}
