export class SameParticipantSchedulingException extends Error {
    constructor() {
        super("Cliente e prestador não podem ser a mesma pessoa.");
        this.name = "SameParticipantSchedulingException";
    }
}
