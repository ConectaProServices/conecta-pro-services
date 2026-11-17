# 01-08 - Planejamento do GitHub Project

## Estrutura do Board

O board deve seguir exatamente os 5 estados da metodologia didática:

1. `Backlog`
2. `Ready`
3. `In Progress`
4. `In Review`
5. `Done`

## Distribuição inicial sugerida

| Issue / Sub-Issue | Status inicial | Observação |
| --- | --- | --- |
| `[UC01] Solicitar Agendamento` | `Ready` | Caso principal, com escopo e requisitos claros |
| `SUB-01 - Modelar e validar o agregado Scheduling` | `Ready` | Base do domínio e do caso de uso |
| `SUB-02 - Definir DTO de entrada e endpoint HTTP de criação` | `Ready` | Contrato de entrada já definido e bem delimitado |
| `SUB-03 - Implementar regra de negócio de solicitação` | `Backlog` | Requer validação do serviço e correta implementação da regra |
| `SUB-04 - Implementar persistência do agendamento` | `Backlog` | Necessita da estrutura de dados estabilizada |
| `SUB-05 - Implementar tratamento de exceções e contratos de erro` | `Backlog` | Deve acompanhar a implementação da API |
| `SUB-06 - Definir testes automatizados do UC01` | `Backlog` | Requer o módulo funcional em estado pronto |

## Recomendações de organização no GitHub Project

- Criar visão `Board` em estilo Kanban.
- Usar colunas com os 5 nomes exatos da metodologia.
- Manter as tasks em `Ready` apenas quando houver clareza de escopo e dependências.
- Usar `Backlog` para atividades que requerem definição adicional de implementação ou revisão técnico-estrutural.
- Manter `In Review` para itens com testes ou documentação em revisão.
- Reservar `Done` apenas para tarefas efetivamente executadas, não para planeamentos.

## Critérios para avaliação do board

- Todas as Issues devem estar vinculadas ao épico principal.
- O fluxo de criação do agendamento deve ser visível em um único painel.
- As tarefas críticas devem aparecer em prioridade e ordem de execução com visibilidade para a equipe.
