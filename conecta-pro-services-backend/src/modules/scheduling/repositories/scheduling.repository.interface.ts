import type { Scheduling } from "../entities/scheduling.entity.js";

export const SCHEDULING_REPOSITORY = Symbol('SCHEDULING_REPOSITORY');

export interface ISchedulingRepository {
    findScheduleById(id: string): Promise<any | null>;
    
    existsOverlapping(professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean>;

    save(scheduling: Scheduling): Promise<Scheduling>;
}