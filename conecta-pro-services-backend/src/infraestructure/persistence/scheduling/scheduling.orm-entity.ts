import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';

@Entity({ name: 'schedulings', schema: 'scheduling' })
export class SchedulingEntity {
    @PrimaryColumn('uuid')
    schedulingId: string;

    @Column({ type: 'uuid' })
    customerId: string;

    @Column({ type: 'uuid' })
    serviceId: string;

    @Column({ type: 'uuid' })
    professionalId: string;

    @Column({ type: 'timestamp with time zone' })
    startsAt: Date;

    @Column({ type: 'timestamp with time zone' })
    endsAt: Date;

    @Column({ type: 'enum', enum: SchedulingStatus })
    status: SchedulingStatus;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
    deletedAt: Date | null;
}
