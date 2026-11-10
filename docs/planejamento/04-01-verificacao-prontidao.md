# 04-01 - Verificação de Prontidão (Definition of Ready - DoR)

## 1. Identificação da Atividade

- **Caso de Uso:** UC01 — Solicitar Agendamento
- **Issue Principal (Epic):** #01 — `[UC01] Solicitar Agendamento`
- **Sub-Issue Selecionada:** SUB-01 (#10) — Modelar e validar o agregado `Scheduling`
- **Responsável pela Execução Técnica:** Guilherme Campos Feuser (`@WearifulCupid0`)
- **Revisora Técnica Designada:** Layssa Rodrigues Alves (`@LayssaRD`)
- **Executor no Ambiente Local:** João Pedro Zanette Sartori (`@JPZS-Git`)
- **Data da Avaliação:** 10/11/2026
- **Status do Planejamento:** Aprovado em Ata de Coordenação no [planejamento-operacional.md](../planejamento-operacional.md)

---

## 2. Matriz de Avaliação da Definition of Ready (DoR)

| Código | Condição de Prontidão | Situação | Evidência / Justificativa Técnica no Projeto |
| :--- | :--- | :---: | :--- |
| **DoR-01** | Objetivo claramente definido | **Atende** | O objetivo da SUB-01 é inequívoco: modelar a entidade de domínio `Scheduling`, suas propriedades e validações de integridade temporal e de participantes. |
| **DoR-02** | Escopo delimitado | **Atende** | Delimitado à camada de domínio (`src/modules/scheduling/entities/`). Não inclui endpoints HTTP (SUB-02), serviços de orquestração (SUB-03) nem persistência TypeORM (SUB-04). |
| **DoR-03** | Critérios de aceite verificáveis | **Atende** | Critérios objetivos e testáveis: (1) O agregado aceita dados válidos com status inicial `PENDING`; (2) Antecedência mínima de 24h é exigida (RN01); (3) Cliente e prestador não podem ser a mesma pessoa (RN05). |
| **DoR-04** | Dependências identificadas | **Atende** | A SUB-01 é a raiz do grafo de dependências (sem pré-requisitos estruturais), produzindo o contrato de domínio para SUB-02, SUB-03, SUB-04 e SUB-06. |
| **DoR-05** | Informações técnicas disponíveis | **Atende** | Stack definida (NestJS, TypeScript, Vitest), arquitetura em camadas descrita em `ORGANIZACAO_ARQUITETURAL.md` e regras detalhadas em `BASE_TECNICA_UC01.md`. |
| **DoR-06** | Responsável definido | **Atende** | Guilherme Campos Feuser designado como executor principal, com perfil de liderança técnica e domínio do ecossistema NestJS/TypeScript. |
| **DoR-07** | Revisão de planejamento concluída | **Atende** | Revisão de planejamento formalizada no Material 02 e aprovada na Ata de Coordenação do Material 03 (08/11/2026). |

---

## 3. Pendências e Riscos Mapeados

1. **Gargalo de Disponibilidade:** Guilherme atua na SUB-01 e na arquitetura. Mitigação aprovada: fechar o contrato do agregado com prioridade para desbloquear SUB-02 e SUB-04.
2. **Segregação de Funções:** A revisão do código e do PR será realizada por Layssa Rodrigues Alves, garantindo revisão por pares independente.

---

## 4. Autorização Formal para Início da Implementação

A Sub-Issue **SUB-01 (#10)** atende cumulativamente a todos os critérios da Definition of Ready (DoR-01 a DoR-07). Fica autorizada a abertura da branch de trabalho e o início do ciclo TDD na fase RED para a cobertura da regra RN05.
