# 12-05 - Refatoração Controlada

## Resultado

**Nenhuma refatoração de código realizada.** A decisão é preservar o fluxo e encaminhar riscos confirmados para o planejamento correspondente. O Material 12 exige evidência e aprovação antes da mudança; não há aprovação explícita para alterar os contratos existentes nem para ampliar o escopo do PR #22.

## Componentes examinados

Controller, DTO de entrada/saída, mapper HTTP, Service, agregado, tokens/interfaces, adaptadores em memória e TypeORM, mapper de persistência, entidade ORM, módulo, filtro de exceções, testes e scripts.

## Motivos para preservar

- Fluxo de criação mantém fronteiras explícitas e contratos HTTP testados.
- DI usa tokens concretos e testes demonstram resolução dos providers.
- Persistência tem mapper próprio e constraint PostgreSQL para sobreposição.
- As alterações do Material 11 foram verificadas sem regressão.
- A correção de RN05 pertence ao tema de contratos de erro da Issue #14.
- O refinamento dos tipos do Repository altera uso do Service de confirmação e merece teste/escopo específico.

## Propostas não executadas

1. Mapear `SameParticipantSchedulingException` ao status de domínio acordado e adicionar teste — decisão pelo responsável da #14.
2. Trocar `Promise<any | null>` por `Promise<Scheduling | null>`, usar `getStatus()` e tipar o retorno do Service — requer ajustar testes/casos de confirmação.
3. Decidir, no planejamento de integração do catálogo, quando substituir `InMemoryServiceCatalog`.

## Contratos preservados

Não foram alteradas assinaturas, token `SCHEDULING_REPOSITORY`, status HTTP, formato de resposta, mapper HTTP, migrations ou configuração do banco.
