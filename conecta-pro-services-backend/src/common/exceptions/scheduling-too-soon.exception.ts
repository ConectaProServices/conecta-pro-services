export class SchedulingTooSoonException extends Error {
    constructor() {
        super("Scheduling requires at least 24 hours of notice.");
        this.name = "SchedulingTooSoonException";
    }
}
