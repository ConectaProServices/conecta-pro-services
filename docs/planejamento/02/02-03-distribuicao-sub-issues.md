# 02-03 - Matriz de Distribuição das Sub-Issues

## 1. Base do planejamento

As Sub-Issues abaixo foram preservadas conforme o planejamento da etapa anterior, sem criação de novos identificadores.

| Identificador | Título da atividade | Complexidade | Dependências técnicas | Assignee | Reviewer | Status atual informado | Status recomendado no board | Justificativa técnica da atribuição |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-01 | Modelar e validar o agregado `Scheduling` | Alta | Nenhuma | Guilherme Campos Feuser | Layssa Rodrigues Alves | Planejado | `Ready` | O responsável técnico da equipe é o mais adequado para a modelagem de domínio e status do aggregate |
| SUB-02 | Definir DTO de entrada e endpoint HTTP de criação | Média | SUB-01 | Layssa Rodrigues Alves | João Pedro Zanette Sartori | Planejado | `Ready` | A coordenação e a visão de API tornam esta atividade apropriada para a integrante que acompanha o fluxo e a documentação |
| SUB-03 | Implementar regra de negócio de solicitação | Alta | SUB-01, SUB-02 | João Pedro Zanette Sartori | Guilherme Campos Feuser | Planejado | `Backlog` | O desenvolvimento da lógica de negócio exige atenção técnica e revisão cruzada de arquitetura |
| SUB-04 | Implementar persistência do agendamento | Alta | SUB-01, SUB-03 | Layssa Rodrigues Alves | Guilherme Campos Feuser | Planejado | `Backlog` | Esta atividade exige integração com o banco, e a coordenação da equipe pode acompanhar a persistência com close feedback do responsável técnico |
| SUB-05 | Implementar tratamento de exceções e contratos de erro | Média | SUB-02, SUB-03, SUB-04 | João Pedro Zanette Sartori | Layssa Rodrigues Alves | Planejado | `Backlog` | É uma tarefa de revisão de contrato e robustez, adequada a um desenvolvedor backend com foco em qualidade do fluxo |
| SUB-06 | Definir testes automatizados do UC01 | Média | SUB-01 a SUB-05 | Guilherme Campos Feuser | João Pedro Zanette Sartori | Planejado | `Backlog` | O responsável técnico pode validar a qualidade do teste e o revisor complementar pode revisar aderência aos requisitos |

## 2. Critérios de distribuição obrigatórios

### 2.1 Segregação de funções

- O revisor da Sub-Issue é sempre diferente do responsável pela execução.
- Quando o projeto tem três integrantes, a revisão cruzada pode ser distribuída alternando responsável e revisor sem criar gargalos.

### 2.2 Equilíbrio de carga

- A carga foi distribuída de forma equilibrada, levando em conta a complexidade e a natureza técnica das tarefas.
- Há prioridade de modelagem e integração para Guilherme e de API e documentação para Layssa, mantendo João como executor central de regra de negócio e validações.

### 2.3 Dependências

- O fluxo crítico começa por `SUB-01` e `SUB-02`, seguido por `SUB-03` e `SUB-04`.
- `SUB-05` e `SUB-06` dependem diretamente de estabilidade técnica do fluxo principal.

## 3. Status recomendado no board

- `Ready`: `SUB-01` e `SUB-02`, desde que tenham a revisão humana registrada e o critério DoR esteja concluído.
- `Backlog`: `SUB-03`, `SUB-04`, `SUB-05` e `SUB-06`, enquanto a revisão complementar e a definição de pronto ainda estiverem sendo finalizadas.

## 4. Observação

A recomendação de status representa a boa prática de governança e não substitui a validação final de revisão humana no GitHub.
