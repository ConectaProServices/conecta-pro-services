export class SchedulingNotFoundException extends Error {
    constructor() {
        super("Scheduling not found.");
        this.name = "SchedulingNotFoundException";
    }
}