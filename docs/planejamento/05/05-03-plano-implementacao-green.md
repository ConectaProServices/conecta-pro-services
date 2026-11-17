# 05-03 - Plano de Implementação Mínima (Fase GREEN do TDD)

## 1. Objetivo Técnico da Implementação

Implementar o comportamento estritamente mínimo em código de produção para que o teste unitário de autoagendamento (regra **RN05**) em `scheduling.entity.spec.ts` passe com sucesso, sem alterar nenhuma asserção do teste e sem introduzir código supérfluo fora do escopo.

---

## 2. Análise da Asserção e Contratos do Teste RED

- **Entrada:** `props` contendo `customerId` e `professionalId` com valores idênticos (`sameUserId`).
- **Invocação:** `Scheduling.request(params, NOW)`
- **Asserção do Teste:**
  ```typescript
  expect(() => Scheduling.request(params, NOW)).toThrow(
      /cliente e prestador não podem ser a mesma pessoa|self-scheduling not allowed/i,
  );
  ```
- **Requisito Mínimo:** Se `props.customerId === props.professionalId`, o método deve disparar uma exceção cujo texto corresponda à expressão regular esperada.

---

## 3. Tabela de Alterações Mapeadas

| Arquivo | Componente / Classe | Responsabilidade | Estado Atual | Alteração Mínima Planejada | Critério de Aceite |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/modules/scheduling/entities/scheduling.entity.ts` | `Scheduling` | Entidade raiz de agregação do domínio | Valida apenas antecedência mínima de 24h (`RN01`) | Inserir instrução de guarda: `if (props.customerId === props.professionalId) throw new Error('Cliente e prestador não podem ser a mesma pessoa.');` | **RN05** — Autoagendamento barrado |

---

## 4. Análise Arquitetural e Invariantes do Domínio

1. **Camada de Domínio Pura:** A regra de que o cliente não pode prestar serviço para si mesmo em um agendamento é uma **invariante intrínseca do agregado**. Ela não deve depender de banco de dados, DTOs de transporte ou controllers HTTP.
2. **Posição da Instrução de Guarda:** A verificação deve ocorrer no início do método de fábrica `Scheduling.request()`, antes da instanciação do objeto `new Scheduling(...)`.
3. **Preservação de Outros Testes:** A nova instrução de guarda não interfere na validação de 24 horas (`RN01`), pois nos testes da RN01 `customerId` e `professionalId` são propositalmente distintos (`2222...` vs `4444...`). Portanto, a suíte preexistente permanecerá verde.

---

## 5. Critérios para Validação do GREEN

- O teste `deve lançar erro de domínio quando customerId e professionalId forem idênticos` deve mudar de **FAIL** para **PASS**.
- Os demais 3 testes em `scheduling.entity.spec.ts` devem continuar como **PASS** (4 testes aprovados no arquivo).
- A suíte completa do backend deve rodar com 100% de sucesso sem qualquer regressão.
