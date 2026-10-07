export const SCHEDULING_REPOSITORY = Symbol('SCHEDULING_REPOSITORY');

export interface ISchedulingRepository {
    findScheduleById(id: string): Promise<any | null>;
}
