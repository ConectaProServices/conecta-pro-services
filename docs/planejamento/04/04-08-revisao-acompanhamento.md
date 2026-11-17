# 04-08 - Revisão Técnica Inicial e Acompanhamento do GitHub Project

## 1. Parecer da Revisão Técnica Inicial (Peer Review)

- **Revisora Técnica:** Layssa Rodrigues Alves (`@LayssaRD`)
- **Desenvolvedor Responsável:** Guilherme Campos Feuser (`@WearifulCupid0`) / João Pedro Zanette Sartori (`@JPZS-Git`)
- **Objeto da Revisão:** Draft Pull Request associado à Sub-Issue SUB-01 (#10)

### Checklist de Avaliação Técnica Inicial

| Critério de Revisão | Avaliação | Observações Técnicas |
| :--- | :---: | :--- |
| **1. Clareza e Legibilidade do Teste** | **Conforme** | O teste utiliza o padrão AAA de forma explícita e intuitiva, com nomenclatura descritiva alinhada aos padrões do projeto. |
| **2. Coerência com o Critério de Aceite** | **Conforme** | Exercita pontualmente a regra RN05 (rejeição de agendamento em que cliente e profissional são idênticos). |
| **3. Legitimidade da Falha RED** | **Conforme** | O teste compila e o runner Vitest executa normalmente, falhando estritamente pela ausência de verificação em `Scheduling.request()`. |
| **4. Atomicidade e Escopo Estrito** | **Conforme** | Não foram introduzidos arquivos desnecessários ou alterações em camadas superiores (ex.: HTTP, TypeORM). |
| **5. Configuração do PR como Draft** | **Conforme** | O PR está devidamente identificado como **Draft Pull Request**, impedindo merge prematuro antes da fase GREEN. |

### Minuta de Comentário da Revisora para o GitHub
```markdown
### 🔍 Revisão Técnica Inicial — Fase RED (Material 04)

**Revisora:** @LayssaRD  
**Data:** 10/11/2026  
**Status do PR:** Rascunho Aprovado (Draft Validado)

**Parecer Técnico:**
O teste automatizado para a regra RN05 foi revisado. Confirmo que a estrutura AAA está clara e que a falha observada no Vitest (`expected [Function] to throw an error`) constitui um RED legítimo no ciclo TDD. 
O código de produção permanece intacto, respeitando a regra capital da unidade. O PR deve permanecer como **Draft** e a Sub-Issue #10 mantida em **`In Progress`** até o início do ciclo GREEN no Material 05.
```

---

## 2. Governança e Atualização do GitHub Project (Kanban)

- **Sub-Issue:** SUB-01 (#10) — Modelar e validar o agregado `Scheduling`
- **Novo Status no Board:** **`In Progress`**
- **Política de WIP Respeitada:** O limite estabelecido no Material 03 (máximo de 3 tarefas simultâneas, iniciando com 2) é estritamente cumprido.

### ⛔ Regras Críticas de Governança
1. **NÃO mover para `In Review`:** Draft PR é um rascunho de trabalho em andamento (*Work in Progress*). O status `In Review` só deve ser utilizado quando a implementação funcional estiver concluída e os testes passarem (após Material 05).
2. **NÃO mover para `Done`:** A regra RN05 ainda não foi implementada no código de produção.
3. **NÃO realizar merge do PR:** A integração na branch `main` só ocorrerá após a conclusão do ciclo TDD (RED ➔ GREEN ➔ REFACTOR).
4. **NÃO fechar a Issue:** A Issue #10 continuará aberta durante o ciclo de implementação.

---

## 3. Próximos Passos (Transição para o Material 05)

1. **Ciclo GREEN:** Implementar a instrução de guarda em `Scheduling.request()` para barrar `props.customerId === props.professionalId`.
2. **Execução e Validação:** Rodar a suíte `npm test` e comprovar que todos os testes passaram (100% GREEN).
3. **Ciclo REFACTOR:** Analisar oportunidades de limpeza de código, documentação e padronização.
4. **Conversão do PR:** Retirar o PR do modo Draft e submeter para a revisão técnica final de integração.
