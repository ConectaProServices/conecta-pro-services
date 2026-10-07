export class SchedulingAlreadyConfirmedException extends Error {
    constructor() {
        super("Scheduling has already been confirmed.");
        this.name = "SchedulingAlreadyConfirmedException";
    }
}