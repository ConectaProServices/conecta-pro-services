# 01-02 - Decomposição em Unidades de Trabalho

## Visão geral

A decomposição abaixo considera o caso de uso UC01 como primeiro slice arquitetural, mantendo a lógica de negócio central em um único fluxo e evitando fragmentação artificial em fases de TDD.

| Identificador | Nome da atividade técnica | Objetivo | Escopo e responsabilidades | Camada | Requisito / regra de origem | Dependências | Critério geral de conclusão |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-01 | Modelar e validar o agregado `Scheduling` | Definir a estrutura e o ciclo de vida do agendamento | Entidade, status, cálculos de início/fim e restrições de domínio | Domain | UC01, RN01, INV-1 | Nenhuma | Entidade pronta e validada pela equipe |
| SUB-02 | Definir DTO de entrada e endpoint HTTP de criação | Expor a operação de agendamento na API | `RequestSchedulingDto`, controller, rota HTTP e serialização de resposta | Presentation/Application | Fluxo principal do UC01 | SUB-01 | Endpoint funcional e sem campos inválidos |
| SUB-03 | Implementar regra de negócio de solicitação | Garantir a criação do agendamento somente em condições válidas | `SchedulingService.requestScheduling`, checagem de catálogo, antecedência, conflito e criação do aggregate | Application/Domain | RN01, RN03, RN05, INV-1 | SUB-01, SUB-02 | Fluxo principal validado pela lógica do serviço |
| SUB-04 | Implementar persistência do agendamento | Salvar e consultar o agendamento no banco | TypeORM entity, repository, mapeamento e transações | Persistence | Persistência do UC01 | SUB-01, SUB-03 | Entidade gravada com sucesso e consulta funcionando |
| SUB-05 | Implementar tratamento de exceções e contratos de erro | Padronizar respostas da API para falhas | Exceptions, `HttpExceptionFilter` e mensagens de erro | Presentation/Application | Fluxos alternativos e de exceção | SUB-02, SUB-03 | Erros da regra retornam status correto |
| SUB-06 | Definir testes automatizados do UC01 | Validar comportamento e regressões futuras | Testes unitários e E2E do cenário principal e alternativos | Test | UC01, regras e validações | SUB-01 a SUB-05 | Suíte de testes com cenários críticos executando |

## Justificativa da decomposição

A decomposição respeita a natureza do problema e preserva a independência funcional das atividades. O fluxo principal do UC01 exige:

- definição do modelo do domínio;
- entrada em API;
- regra de negócio central;
- persistência;
- tratamento de erro;
- validação por testes.

Não houve criação artificial de subtarefas separadas para RED/GREEN, mantendo cada unidade concentrada em um objetivo técnico legítimo.

## Dependências e observações técnicas

- SUB-02 depende de SUB-01, pois a interface de entrada precisa refletir a modelagem do domínio.
- SUB-03 depende do contrato de entrada e da entidade do domínio.
- SUB-04 só deve ser iniciada após a definição da entidade e da regra principal, evitando rework de persistência.
- SUB-05 deve ser alinhada ao padrão de respostas HTTP do backend.
- SUB-06 pode ocorrer em paralelo à finalização de SUB-04 desde que os casos de teste sejam definidos com antecedência.

## Critérios gerais de conclusão do slice

O slice UC01 pode ser considerado pronto quando:

- a rota de criação do agendamento estiver disponível;
- a regra de antecedência `24h` estiver aplicada;
- a sobreposição de agenda for validada;
- a persistência do agendamento funcionar;
- os erros relevantes forem tratados e documentados;
- a suíte de testes do caso de uso estiver estável.
