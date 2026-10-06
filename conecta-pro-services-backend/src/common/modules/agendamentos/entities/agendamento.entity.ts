import { AgendamentoStatus } from "../../../enum/agendamento-status.enum.js";

export class Agendamento {
    id: string;
    status: AgendamentoStatus;
    data: Date;
    hora: string;
    clienteId: string;
    profissionalId: string;
}