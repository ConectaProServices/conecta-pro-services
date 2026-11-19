export class CustomerDailySchedulingLimitException extends Error {
    constructor() {
        super("Cliente já possui um agendamento ativo nesta data.");
        this.name = "CustomerDailySchedulingLimitException";
    }
}
