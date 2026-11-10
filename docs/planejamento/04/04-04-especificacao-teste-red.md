# 04-04 - Especificação do Primeiro Teste Automatizado (Fase RED do TDD)

## 1. Critério de Aceite Selecionado

- **Origem dos Requisitos:** [01-01-analise-tecnica.md](./01-01-analise-tecnica.md), Regra de Negócio **RN05**.
- **Regra de Negócio (RN05):** "O cliente e o prestador não podem ser a mesma pessoa no mesmo agendamento (`customerId !== professionalId`)."
- **Critério de Aceite Específico:**
  > "Dado que uma solicitação de agendamento seja enviada com identificador de cliente (`customerId`) idêntico ao identificador do prestador (`professionalId`),
  > Quando o método de criação do agregado `Scheduling.request()` for invocado,
  > Então o sistema deve rejeitar a operação lançando um erro de domínio que proíbe o autoagendamento, impedindo a criação do agendamento com status `PENDING`."

---

## 2. Justificativa Técnica do Nível de Teste

- **Nível Escolhido:** Teste Unitário de Domínio (Agregado `Scheduling`).
- **Justificativa Arquitetural:** 
  1. A regra de negócio RN05 é uma invariante fundamental do domínio e não depende de persistência em banco de dados ou transporte HTTP.
  2. Testes de unidade executam em milissegundos (menos de 10ms), fornecendo feedback instantâneo durante o desenvolvimento.
  3. Garante o isolamento completo da lógica de negócio e expressa com precisão o contrato exigido pela Sub-Issue SUB-01 (#10).

---

## 3. Localização do Arquivo e Dependências

- **Arquivo de Teste:** `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.spec.ts`
- **Alvo do Teste:** Método estático `Scheduling.request()` em `conecta-pro-services-backend/src/modules/scheduling/entities/scheduling.entity.ts`
- **Framework de Testes:** Vitest + TypeScript no ambiente Node.js.

---

## 4. Código Completo do Cenário de Teste (Padrão AAA)

```typescript
describe('Scheduling.request (RN05 - proibição de cliente idêntico ao prestador)', () => {
    it('deve lançar erro de domínio quando customerId e professionalId forem idênticos', () => {
        // Arrange (Preparação): dados válidos com antecedência > 24h, porém com IDs iguais
        const sameUserId = '22222222-2222-4222-8222-222222222222';
        const startsAt = hoursFromNow(48);
        const params = {
            ...buildParams(startsAt),
            customerId: sameUserId,
            professionalId: sameUserId,
        };

        // Act & Assert (Ação e Verificação):
        // O método de fábrica deve barrar a criação e lançar erro de domínio
        expect(() => Scheduling.request(params, NOW)).toThrow(
            /cliente e prestador não podem ser a mesma pessoa|self-scheduling not allowed/i,
        );
    });
});
```

---

## 5. Comando de Execução

```bash
cd conecta-pro-services-backend
npm test -- src/modules/scheduling/entities/scheduling.entity.spec.ts
```
