export class SchedulingConflictException extends Error {
    constructor() {
        super("The professional already has a scheduling in this time window.");
        this.name = "SchedulingConflictException";
    }
}
