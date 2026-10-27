import { describe, expect, it } from 'vitest';
import { Scheduling } from './scheduling.entity.js';
import { SchedulingStatus } from '../../../enum/scheduling-status.enum.js';
import { SchedulingTooSoonException } from '../../../exceptions/scheduling-too-soon.exception.js';

const NOW = new Date('2026-11-10T10:00:00.000Z');
const HOUR_IN_MS = 60 * 60 * 1000;
const hoursFromNow = (hours: number) => new Date(NOW.getTime() + hours * HOUR_IN_MS);

const buildParams = (startsAt: Date) => ({
    schedulingId: '11111111-1111-4111-8111-111111111111',
    customerId: '22222222-2222-4222-8222-222222222222',
    serviceId: '33333333-3333-4333-8333-333333333333',
    professionalId: '44444444-4444-4444-8444-444444444444',
    startsAt,
    endsAt: new Date(startsAt.getTime() + HOUR_IN_MS),
});

describe('Scheduling.request (RN01 - antecedência mínima de 24h)', () => {
    it('should create a PENDING scheduling when it starts more than 24h from now', () => {
        const startsAt = hoursFromNow(48);

        const scheduling = Scheduling.request(buildParams(startsAt), NOW);

        expect(scheduling.getStatus()).toBe(SchedulingStatus.PENDING);
        expect(scheduling.startsAt).toEqual(startsAt);
    });

    it('should accept a scheduling that starts exactly 24h from now', () => {
        const scheduling = Scheduling.request(buildParams(hoursFromNow(24)), NOW);

        expect(scheduling.getStatus()).toBe(SchedulingStatus.PENDING);
    });

    it('should throw SchedulingTooSoonException when it starts less than 24h from now', () => {
        const params = buildParams(hoursFromNow(23));

        expect(() => Scheduling.request(params, NOW)).toThrow(SchedulingTooSoonException);
    });
});
