export class ServiceNotAvailableException extends Error {
    constructor() {
        super("Service not available.");
        this.name = "ServiceNotAvailableException";
    }
}