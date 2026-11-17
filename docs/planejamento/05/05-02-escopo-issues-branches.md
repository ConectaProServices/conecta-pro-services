# 05-02 - Escopo, Issues de Implementação e Estratégia de Branches

## 1. Identificação da Issue de Implementação e Cenário

- **Issue Principal (Epic):** #01 — `[UC01] Solicitar Agendamento`
- **Sub-Issue Vinculada:** SUB-01 (#10) — Modelar e validar o agregado `Scheduling`
- **Classificação de Cenário:** **Cenário A — Uma única Issue contempla Teste e Implementação**.
  * A Sub-Issue #10 engloba a definição completa do agregado `Scheduling`, abrangendo tanto a escrita do teste inicial quanto a implementação do comportamento de domínio para as regras RN01 e RN05.
  * O ciclo TDD (RED ➔ GREEN) é executado no escopo coeso da mesma unidade de trabalho.

---

## 2. Responsabilidades e Papéis Técnicos

| Integrante | Papel no Projeto | Papel nesta Atividade |
| :--- | :--- | :--- |
| **Guilherme Campos Feuser** (`@WearifulCupid0`) | Responsável Técnico (Tech Lead) | Autor do teste RED e validador de consistência de domínio |
| **João Pedro Zanette Sartori** (`@JPZS-Git`) | Desenvolvedor Backend | Executor da implementação GREEN no ambiente local |
| **Layssa Rodrigues Alves** (`@LayssaRD`) | Coordenadora / Revisora | Revisora por pares independente do código e do PR |

---

## 3. Verificação da Definition of Ready (DoR) para Implementação

| Critério | Situação | Verificação |
| :--- | :---: | :--- |
| **DoR-01 — Objetivo** | **Atende** | Implementar a verificação de participantes idênticos no agregado `Scheduling`. |
| **DoR-02 — Escopo** | **Atende** | Estritamente restrito à classe `Scheduling` em `src/modules/scheduling/entities/scheduling.entity.ts`. |
| **DoR-03 — Critérios de Aceite** | **Atende** | O teste `scheduling.entity.spec.ts` falhando na fase RED já estabeleceu o critério exato a ser satisfeito. |
| **DoR-04 — Dependências** | **Atende** | Nenhuma dependência externa; a entidade é pura no domínio. |
| **DoR-05 — Informações Técnicas** | **Atende** | Assinatura de `Scheduling.request(props, now)` e mensagem esperada já estabelecidas. |
| **DoR-06 — Responsável** | **Atende** | João Pedro Zanette Sartori executando, Guilherme e Layssa acompanhando. |
| **DoR-07 — Revisão Prévia** | **Atende** | Artefatos do Material 04 aprovados e sincronizados no repositório. |

---

## 4. Estratégia de Branches e Pull Requests

### 4.1 Estratégia de Branch
- **Branch Ativa:** `feature/10-modelar-agregado-scheduling`
- **Branch Destino (Base):** `main`
- **Justificativa:** Como o Cenário A se aplica, o trabalho continua na mesma branch isolada onde o teste RED foi criado e versionado, mantendo o histórico de commits rastreável e contínuo.

### 4.2 Estratégia de Pull Request
- O **Draft Pull Request** já configurado para a branch `feature/10-modelar-agregado-scheduling` receberá os novos commits da fase GREEN.
- **Governança de Estados:** O PR continuará como **Draft** e a Sub-Issue permanecerá em **`In Progress`** até a conclusão das fases GREEN e subsequente REFACTOR (Material 06). Não haverá merge prematuro na branch `main`.

---

## 5. Confirmação do Ambiente Local

- Comando de verificação:
  ```bash
  git branch --show-current
  git status
  ```
- **Status confirmado:** A branch `feature/10-modelar-agregado-scheduling` está ativa, com árvore de trabalho limpa e sincronizada com o remoto `origin/feature/10-modelar-agregado-scheduling`.
