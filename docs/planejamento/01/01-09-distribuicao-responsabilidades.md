# 01-09 - Distribuição de Responsabilidades

## Matriz de alocação da equipe

| Identificador | Atividade técnica | Responsável designado | Dependências de execução | Estado inicial | Recomendações de comunicação |
| --- | --- | --- | --- | --- | --- |
| `[UC01] Solicitar Agendamento` | Epic do fluxo principal | Guilherme Campos Feuser | Definição do projeto e revisão do caso de uso | `Ready` | Revisão final da equipe antes de iniciar implementação |
| SUB-01 | Modelar e validar o agregado `Scheduling` | Guilherme Campos Feuser | Nenhuma | `Ready` | Validar regra de status e duração com os demais membros |
| SUB-02 | DTO e endpoint HTTP | Layssa Rodrigues Alves | SUB-01 | `Ready` | Conferir alinhamento com a API e contrato final |
| SUB-03 | Regra de negócio de solicitação | Guilherme Campos Feuser | SUB-01, SUB-02 | `Backlog` | Debater regras e exceções com a equipe |
| SUB-04 | Persistência e repository | Layssa Rodrigues Alves | SUB-01, SUB-03 | `Backlog` | Validar mapeamento e schema no banco |
| SUB-05 | Exceções e respostas de erro | João Pedro Zanette Sartori | SUB-02, SUB-03, SUB-04 | `Backlog` | Garantir compatibilidade com o padrão da API |
| SUB-06 | Testes unitários e E2E | João Pedro Zanette Sartori | SUB-01 a SUB-05 | `Backlog` | Reunião de validação após implementação |

## Recomendações de alinhamento

- A cada tarefa significativa, o responsável deve registrar em comentário da Issue o que foi entendido, o que foi validado e o que ainda depende de confirmação.
- O módulo de agendamento deve ser revisado em conjunto pela equipe antes da entrada em `In Progress`.
- A parte de persistência e a de regra de negócio devem ser revisadas em conjunto para evitar divergência entre domínio e banco.
- A etapa de testes deve ser considerada uma atividade de validação da equipe e não apenas da última pessoa envolvida na implementação.
