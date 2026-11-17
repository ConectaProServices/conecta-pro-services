import { Column, CreateDateColumn, DeleteDateColumn, Entity, Exclusion, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SchedulingStatus } from '../../../common/enum/scheduling-status.enum.js';

// Espelha a constraint criada pela migration CreateSchedulings1793060000000 (INV-1: sem sobreposição
// de agendamentos ativos do mesmo prestador). Sem esta declaração, o TypeORM trata a constraint como
// "desconhecida" e uma migration gerada (ou o synchronize) a removeria.
@Exclusion(
    'EXCL_schedulings_no_overlap',
    `USING gist ("professionalId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ("status" IN ('PENDING', 'CONFIRMED') AND "deletedAt" IS NULL)`,
)
@Entity({ name: 'schedulings', schema: 'scheduling' })
export class SchedulingEntity {
    @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_schedulings_schedulingId' })
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
