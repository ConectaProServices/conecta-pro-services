export const AGENDAMENTO_REPOSITORY = Symbol('AGENDAMENTO_REPOSITORY');

export interface IAgendamentoRepository {
    findById(id: string): Promise<any | null>;
}
