# 05-04 - Implementação do Comportamento GREEN

## 1. Identificação da Atividade e Branch

- **Caso de Uso:** UC01 — Solicitar Agendamento
- **Issue Vinculada:** SUB-01 (#10) — Modelar e validar o agregado `Scheduling`
- **Branch Ativa:** `feature/10-modelar-agregado-scheduling`
- **Arquivo Modificado:** `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts`
- **Autor da Modificação:** João Pedro Zanette Sartori (`@JPZS-Git`) / Guilherme Campos Feuser (`@WearifulCupid0`)

---

## 2. Código de Produção Implementado

Na classe `Scheduling`, no método estático de fábrica `request()`, foi inserida a seguinte cláusula de guarda mínima:

```typescript
    public static request(props: RequestSchedulingProps, now: Date = new Date()): Scheduling {
        // Cláusula de guarda para satisfazer o teste da regra RN05 (Fase GREEN)
        if (props.customerId === props.professionalId) {
            throw new Error("Cliente e prestador não podem ser a mesma pessoa.");
        }

        if (props.startsAt.getTime() - now.getTime() < MIN_NOTICE_IN_MS) {
            throw new SchedulingTooSoonException();
        }

        return new Scheduling(
            props.schedulingId,
            props.customerId,
            props.serviceId,
            props.professionalId,
            props.startsAt,
            props.endsAt,
            SchedulingStatus.PENDING,
        );
    }
```

---

## 3. Explicação Técnica Linha a Linha

- `if (props.customerId === props.professionalId)`: Compara os identificadores de cliente e profissional passados na requisição de agendamento.
- `throw new Error("Cliente e prestador não podem ser a mesma pessoa.");`: Interrompe a execução antes da criação da instância e dispara um erro de domínio contendo a mensagem esperada pela expressão regular `/cliente e prestador não podem ser a mesma pessoa|self-scheduling not allowed/i` definida no teste.
- **Ordem de Execução:** A verificação de participantes é executada antes da validação de tempo (`MIN_NOTICE_IN_MS`), garantindo que solicitações com participantes inválidos sejam rejeitadas precocemente (fail-fast).

---

## 4. Relação Direta com as Asserções do Teste RED

| Asserção no Teste RED | Código Implementado | Resultado |
| :--- | :--- | :---: |
| `expect(() => Scheduling.request(params, NOW)).toThrow(...)` | `if (props.customerId === props.professionalId) throw new Error(...)` | **Aprovado (PASS)** |

---

## 5. Deliberações para a Fase de Refatoração (Material 06)

Em conformidade estrita com o ciclo TDD:
- **Implementado agora (GREEN):** O comportamento estritamente mínimo para fazer o teste passar com mensagem descritiva.
- **Postergado para o REFACTOR:**
  1. Criação de classe de exceção fortemente tipada e dedicada (ex.: `SameParticipantSchedulingException` estendendo uma classe base de exceções de domínio).
  2. Ajuste do filtro global de exceções HTTP (`domain-http-exception.filter.ts`) para mapear essa exceção de domínio para o código HTTP `400 Bad Request` com contrato padronizado.
  3. Internacionalização ou padronização de constantes de mensagens de erro de domínio.
