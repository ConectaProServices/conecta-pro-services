# 01-05 - Matriz de Rastreabilidade

| Requisito / regra / fluxo do caso de uso | Identificador da Sub-Issue | Atividade técnica associada | Critério de aceite vinculado | Comportamento a ser verificado |
| --- | --- | --- | --- | --- |
| Definição do aggregate `Scheduling` | SUB-01 | Modelar entidade e regras do domínio | Entidade com atributos do agendamento e status inicial | A criação do objeto representa corretamente o agendamento pendente |
| Fluxo principal de criação do agendamento | SUB-02 | Controller e DTO de entrada | Endpoint aceita payload válido e valida UUID/data | Requisição com dados válidos é aceita pela API |
| Serviço existente no catálogo | SUB-03 | Verificação do catálogo no serviço | Serviço inexistente é rejeitado | Sistema identifica ausência do serviço antes de salvar |
| RN01 - antecedência mínima de 24h | SUB-03 | Regra de negócio da reserva | Solicitação menor que 24h é rejeitada | Resposta de erro com regra aplicada corretamente |
| INV-1 - sobreposição da agenda do prestador | SUB-03 | Verificação de conflitos | Agendamento em horário sobreposto é rejeitado | Sistema valida conflito antes de salvar |
| Persistência do agendamento | SUB-04 | Repository e entity TypeORM | Agendamento salvo e consultável | Dados persistidos em banco respeitando estrutura do módulo |
| Tratamento de fluxo alternativo/erro | SUB-05 | Exceptions e filtros HTTP | Erro de regra e conflito retornam resposta padronizada | API entrega status e mensagem compatíveis com a falha |
| Cobertura de testes do UC01 | SUB-06 | Testes unitários e E2E | Fluxo principal e cenários negativos cobertos | Suíte de testes valida cenários críticos do caso de uso |

## Observações

- A regra RN03 (um cliente não pode ter mais de um agendamento ativo na mesma data) e a regra RN05 (cliente e prestador não podem ser a mesma pessoa) estão identificadas no planejamento como refinamentos do núcleo e devem ser revisadas durante a implementação para confirmação final e integração com a persistência.
- Não há atividades sem justificativa técnica no slice atual; o conjunto de sub-issues acompanha os requisitos centrais do caso de uso sem duplicação de esforço.
