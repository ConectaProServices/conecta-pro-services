# 05-01 - Diagnóstico do Estado RED (TDD)

## 1. Identificação da Atividade e Rastreabilidade

- **Caso de Uso:** UC01 — Solicitar Agendamento
- **Issue Principal (Epic):** #01 — `[UC01] Solicitar Agendamento`
- **Sub-Issue Vinculada:** SUB-01 (#10) — Modelar e validar o agregado `Scheduling`
- **Branch Ativa:** `feature/10-modelar-agregado-scheduling`
- **Responsável Técnico:** Guilherme Campos Feuser (`@WearifulCupid0`)
- **Desenvolvedor Executor:** João Pedro Zanette Sartori (`@JPZS-Git`)
- **Revisora Técnica:** Layssa Rodrigues Alves (`@LayssaRD`)
- **Data do Diagnóstico:** 10/11/2026

---

## 2. Critério de Aceite e Teste Automatizado da Fase RED

- **Regra de Negócio Coberta:** **RN05** — Proibição de autoagendamento ("O cliente e o prestador não podem ser a mesma pessoa no mesmo agendamento").
- **Critério de Aceite Formal:**
  > "Dado que uma solicitação de agendamento seja realizada onde o identificador do cliente (`customerId`) seja idêntico ao identificador do profissional prestador (`professionalId`),
  > Quando o método de criação do agregado `Scheduling.request()` for executado,
  > Então a operação deve ser rejeitada imediatamente através do lançamento de um erro de domínio proibindo o autoagendamento."
- **Arquivo de Teste:** `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts`
- **Framework e Runner:** Vitest v4.1.11 no ambiente Node.js / TypeScript.
- **Comando de Execução:**
  ```bash
  npm test -- src/modules/scheduling/entities/scheduling.entity.spec.ts
  ```

---

## 3. Evidência Documentada da Falha RED

```text
 FAIL  src/modules/scheduling/entities/scheduling.entity.spec.ts > Scheduling.request (RN05 - proibição de cliente idêntico ao prestador) > deve lançar erro de domínio quando customerId e professionalId forem idênticos
AssertionError: expected [Function] to throw an error

- Expected:
null

+ Received:
undefined

 ❯ src/modules/scheduling/entities/scheduling.entity.spec.ts:55:55
     53|         // Act & Assert (Ação e Verificação):
     54|         // O método de fábrica deve barrar a criação e lançar erro de domínio
     55|         expect(() => Scheduling.request(params, NOW)).toThrow(
       |                                                       ^
     56|             /cliente e prestador não podem ser a mesma pessoa|self-scheduling not allowed/i,
     57|         );
```

---

## 4. Análise da Causa Raiz e Comportamento Ausente

1. **Causa Técnica:** O método de fábrica `Scheduling.request()` na classe `Scheduling` (`conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts`) atualmente valida apenas a regra de antecedência mínima de 24 horas (`RN01`). Não há qualquer verificação de igualdade entre `props.customerId` e `props.professionalId`.
2. **Comportamento Observado:** O método instancia e retorna o objeto `Scheduling` com status `PENDING` mesmo quando os identificadores são idênticos, em vez de interromper o fluxo e lançar o erro de domínio esperado pela asserção `toThrow`.
3. **Validação do RED Legítimo:**
   - O código compila sem erros de sintaxe ou tipagem TypeScript.
   - O runner Vitest executou a suíte perfeitamente em 254ms.
   - As demais asserções de RN01 continuam passando (3 testes aprovados).
   - A única falha é funcional e decorre estritamente da ausência da regra RN05 no código de produção.

---

## 5. Autorização para Início da Implementação GREEN

O estado RED da Sub-Issue SUB-01 (#10) está completamente validado, com evidências documentadas e alinhadas aos contratos do projeto. Fica formalmente autorizada a passagem para a **Fase 3 (Verificação de Escopo e Estratégia de Branches)** e **Fase 4 (Planejamento da Implementação Mínima)**.
