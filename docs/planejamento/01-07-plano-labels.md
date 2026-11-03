# 01-07 - Plano de Labels

## Objetivo

Organizar as Issues do repositório conforme funcionalidade, tipo de atividade, camada de implementação, prioridade e estado de prontidão.

| Nome da label | Cor sugerida | Finalidade / descrição | Onde será aplicada |
| --- | --- | --- | --- |
| `epic` | `#5319E7` | Agrupa o caso de uso principal e o seu contexto de implementação | `[UC01] Solicitar Agendamento` |
| `scheduling` | `#0E7490` | Identifica tudo relacionado ao módulo de agendamento | UC01, SUB-01, SUB-03, SUB-06 |
| `backend` | `#3B82F6` | Refere-se ao desenvolvimento da camada de aplicação e infraestrutura | SUB-02, SUB-03, SUB-04, SUB-05 |
| `api` | `#F59E0B` | Identifica contratos HTTP, endpoints e serialização | SUB-02, SUB-05 |
| `domain` | `#10B981` | Marca itens de regra e modelagem do domínio | SUB-01, SUB-03 |
| `persistence` | `#8B5CF6` | Agrupa a work item relacionada ao banco de dados e repository | SUB-04 |
| `validation` | `#EF4444` | Indica validação de entrada, regras e exceções | SUB-02, SUB-03, SUB-05 |
| `test` | `#22C55E` | Identifica itens voltados para automação de testes | SUB-06 |
| `documentation` | `#F97316` | Marca documentação técnica e operacional | documentação e README |
| `priority:high` | `#DC2626` | Dá destaque ao item crítico para início do slice | UC01 e SUB-03 |
| `priority:medium` | `#F59E0B` | Identifica atividade importante mas não crítica | SUB-02, SUB-04 |
| `priority:low` | `#84CC16` | Uso para melhoria incremental | documentação e refinamentos |
| `ready` | `#0EA5E9` | Indica que o item tem definição suficiente para execução | itens iniciais do board |
| `blocked` | `#6B7280` | Marca bloqueios em dependência ou ambiente | itens suspensos |

## Observações

- O uso das labels deve ser coerente e não redundante.
- A label `epic` deve ser usada apenas no caso principal.
- `priority:*` é complementar e não substitui a etiqueta de funcionalidade.
- A organização por contexto (`scheduling`, `domain`, `api`, `persistence`) ajuda a rastrear o impacto do slice ao longo do projeto.
