import { IsUUID, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestSchedulingDto {
    @IsUUID()
    @IsNotEmpty()
    public readonly customerId: string;
    
    @IsUUID()
    @IsNotEmpty()
    public readonly serviceId: string;
    
    @IsUUID()
    @IsNotEmpty()
    public readonly professionalId: string;
    
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    public readonly startsAt: Date;
}
