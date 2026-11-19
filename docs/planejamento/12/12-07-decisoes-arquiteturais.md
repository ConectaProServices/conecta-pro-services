# 12-07 - Decisões Arquiteturais

## DA-01 — Preservar as fronteiras de criação

- **Problema:** nenhum defeito demonstrado no fluxo principal de fronteiras.
- **Evidência:** Controller → Service; Service → contratos/tokens; adapter TypeORM → mapper ORM; DTO HTTP produzido pelo mapper dedicado.
- **Alternativas:** refatorar preventivamente ou preservar.
- **Decisão:** preservar.
- **Consequências:** limita risco de regressão enquanto PR #22 ainda aguarda revisão; mantém dois itens de tipo para trabalho específico.
- **Verificação:** 22 testes rápidos, 5 testes PostgreSQL, build aprovado.

## DA-02 — Tratar RN05 no escopo de erro

- **Problema:** regra conhecida gera `SameParticipantSchedulingException`, mas a tabela do filtro não a mapeia; foi observado HTTP 500.
- **Alternativas:** alterar o filtro agora ou encaminhar para a Issue de erro existente.
- **Decisão:** não alterar nesta auditoria; encaminhar para #14, que prevê respostas HTTP apropriadas para erros de regra.
- **Consequências:** comportamento 500 permanece até correção e teste; evita misturar escopos sem aprovação.

## DA-03 — Fortalecer tipos do Repository

- **Problema:** `any` apaga contrato e permite acesso a `Scheduling.status` privado no Service.
- **Alternativas:** corrigir imediatamente ou criar mudança focada com teste de confirmação e contrato de retorno.
- **Decisão:** registrar como melhoria proposta; não executar sem aprovação.
- **Consequências:** warning e risco de tipo continuam; a implementação concreta já retorna `Scheduling | null`.

## DA-04 — Catálogo em memória é composição atual

- **Problema:** nenhum defeito de persistência foi comprovado, mas o provider ativo é catálogo demo em memória.
- **Decisão:** tratar como limitação de integração/planejamento, não substituir sem um contrato concreto do módulo de catálogo.
