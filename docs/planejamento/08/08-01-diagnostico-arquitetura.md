# 08-01 - Diagnóstico da Arquitetura e Linha de Base

## 1. Identificação

- Projeto: Conecta Pro Services
- Caso de uso: UC01 - Solicitar Agendamento
- Epic: #1 (aberta, `Todo`)
- Stack: NestJS 12, TypeScript 6, Vitest 4.1.11, Supertest 7.3.1, pnpm, TypeORM + PostgreSQL 17
- Backend: `conecta-pro-services-backend/`
- Artefatos de origem: `docs/planejamento/07/07-01..07-08` (na `main`)
- Destino desta etapa: `docs/planejamento/08/`
- Data: 17/11/2026

## 2. Mapeamento das Issues

| Sub-Issue | Issue | Estado / board | Papel nesta etapa |
| --- | --- | --- | --- |
| SUB-01 Agregado `Scheduling` | #10 | Fechada / `Done` | Contrato de domínio reutilizado |
| SUB-02 DTO e endpoint HTTP | #11 | Fechada / `Done` (PR #17) | Controller, DTO e `ValidationPipe` reutilizados |
| SUB-03 Regra de negócio | #12 | Aberta / `Todo` | `SchedulingService.requestScheduling` reutilizado sem alteração |
| SUB-04 Persistência | #13 | Aberta / `Todo`, sem assignee | Dona do contrato de persistência e do planejamento da Fase 10. O `InMemorySchedulingRepository` toca seu escopo (coordenação necessária) |
| SUB-05 Exceções | #14 | Aberta / `Todo` | Mapeamento de RN05 pendente |
| **SUB-06 Testes automatizados** | **#15** | **Aberta / `Todo`, sem assignee** | **Sub-Issue desta etapa** (teste integrado) |

Decisão da equipe para esta etapa: **João executa a SUB-06 e Layssa revisa**. O corpo da #15 ainda indica "Responsável: Guilherme / Revisor: João".

## 3. Arquitetura real em camadas

```text
HTTP POST /schedulings
   -> ValidationPipe({ whitelist, transform }) + DomainHttpExceptionFilter   (main.ts)
   -> SchedulingController.request(dto: RequestSchedulingDto)
   -> SchedulingService.requestScheduling(input)
        -> SERVICE_CATALOG       -> InMemoryServiceCatalog          (em memória)
        -> Scheduling.request()  (RN05, RN01)
        -> SCHEDULING_REPOSITORY -> TypeOrmSchedulingRepository     (PostgreSQL real)
```

### Divergência em relação ao Material 08

O Material 08 pressupõe que o Material 07 deixou um **repositório em memória** ligado ao token. Neste projeto:

- O `SCHEDULING_REPOSITORY` já está ligado a uma implementação **TypeORM/PostgreSQL real** (`useExisting: TypeOrmSchedulingRepository`), com entidade ORM, mapper e migration (`1793060000000-CreateScheduling`). Esse código existe desde antes do Material 04, embora a SUB-04 (#13) siga em `Todo`.
- **Não existe** repositório de agendamento em memória. Só o catálogo (`InMemoryServiceCatalog`) é em memória.
- O `SchedulingModule` importa `TypeOrmModule.forFeature([SchedulingEntity])`, então o **módulo real não compila sem `DataSource`**.

Decisão da equipe: criar um `InMemorySchedulingRepository` que implementa `ISchedulingRepository` e usá-lo no teste integrado via token, **sem alterar o provider de produção** (que continua TypeORM).

## 4. Contratos preservados

| Contrato | Local | Definição |
| --- | --- | --- |
| Entidade | `src/modules/scheduling/entities/scheduling.entity.ts` | `Scheduling(schedulingId, customerId, serviceId, professionalId, startsAt, endsAt, status, createdAt, updatedAt, deletedAt)`; `Scheduling.request(props, now?)`; `getStatus()` |
| Repositório | `src/modules/scheduling/repositories/scheduling.repository.interface.ts` | `ISchedulingRepository { findScheduleById(id); existsOverlapping(professionalId, startsAt, endsAt); save(scheduling) }` |
| Token | idem | `SCHEDULING_REPOSITORY = Symbol('SCHEDULING_REPOSITORY')` |
| Catálogo | `src/modules/scheduling/ports/service-catalog.interface.ts` | `SERVICE_CATALOG`; `IServiceCatalog.findById(serviceId)` |
| Service | `src/modules/scheduling/services/scheduling.service.ts` | `requestScheduling(input: RequestSchedulingDto)` → `{ schedulingId, customerId, serviceId, professionalId, startsAt, endsAt, status, message }` |
| Controller | `src/modules/scheduling/controllers/scheduling.controller.ts` | `POST /schedulings`, `@HttpCode(201)` |
| DTO | `src/modules/scheduling/dtos/request-scheduling.dto.ts` | `customerId`, `serviceId`, `professionalId` (`@IsUUID`, `@IsNotEmpty`); `startsAt` (`@Type(() => Date)`, `@IsDate`) |
| Bootstrap | `src/main.ts` | `ValidationPipe({ whitelist: true, transform: true })` + `DomainHttpExceptionFilter` globais |

## 5. Pacotes e ambiente

- `@nestjs/testing` ^12.0.1, `supertest` ^7.0.0, `vitest` ^4.1.2, `class-validator` ^0.15.1, `class-transformer` ^0.5.1, `@nestjs/typeorm` ^12.0.2, `typeorm` ^1.1.2, `pg` ^8.23.1
- `pnpm test` → `vitest run` (`**/*.spec.ts`); `pnpm test:e2e` → `vitest.config.e2e.ts` (`**/*.e2e-spec.ts`)
- Imports ESM com sufixo `.js`; `supertest` importado como `import request from 'supertest'`
- Postgres local (`conecta-postgres`, porta 5435) e `.env` local não versionado, usados somente pelo E2E existente

## 6. Testes existentes

| Arquivo | Nível | Testes |
| --- | --- | --- |
| `src/modules/scheduling/entities/scheduling.entity.spec.ts` | Unitário de domínio (RN01, RN05) | 4 |
| `src/modules/scheduling/services/request-scheduling.service.spec.ts` | Unitário do Service (repositório e catálogo mockados) | 4 |
| `src/modules/scheduling/services/scheduling.services.spec.ts` | Unitário do Service (`confirmScheduling`) | 2 |
| `src/modules/scheduling/controllers/scheduling.controller.spec.ts` | HTTP com Service mockado (Material 07) | 2 |
| `src/app.controller.spec.ts` | Unitário (scaffold) | 1 |
| `test/scheduling/request-scheduling.e2e-spec.ts` | E2E com `AppModule` + Postgres real | 2 |
| `test/app.e2e-spec.ts` | E2E (scaffold) | 1 |

## 7. Linha de base (Fase 3), execução real

- Branch: `main`, commit `b3ac5be` (merge do PR #17), worktree limpo (exceto o prompt 08 não versionado)

```text
$ pnpm test
 Test Files  5 passed (5)
      Tests  13 passed (13)
   Duration  1.28s
```

Lista detalhada (`vitest run --reporter=verbose`): 13 `✓`, 0 `×`. Inclui os 4 do agregado, os 4 de `requestScheduling`, os 2 de `confirmScheduling`, os 2 HTTP mockados e 1 do `AppController`.

```text
$ pnpm test:e2e
 Test Files  2 passed (2)
      Tests  3 passed (3)
   Duration  1.57s
```

| Métrica | `pnpm test` | `pnpm test:e2e` |
| --- | --- | --- |
| Arquivos | 5 | 2 |
| Testes | 13 | 3 |
| Aprovados | 13 | 3 |
| Falhas | 0 | 0 |
| Erros | nenhum (só o aviso do `vite-tsconfig-paths`) | nenhum |

Resultado: **linha de base verde** e coerente com 07-06 (13/13 e 3/3).

## 8. Verificação de viabilidade (experimento descartável, não versionado)

Arquivo temporário `src/zz-spike.spec.ts`, executado e removido:

1. `Test.createTestingModule({ imports: [SchedulingModule] }).compile()` **falha**:

   ```text
   Nest can't resolve dependencies of the SchedulingEntityRepository (?). Please make sure that the argument DataSource at index [0] is available in the TypeOrmModule module.
   ```

2. O mesmo módulo com `.overrideProvider(getRepositoryToken(SchedulingEntity)).useValue({})` e `.overrideProvider(SCHEDULING_REPOSITORY).useClass(<repositório em memória>)` **compila**.

Conclusão: o teste integrado pode usar o **`SchedulingModule` real**. Os overrides necessários ficam restritos à infraestrutura de banco, que não é exercitada.

## 9. Branches, PRs e board

- Branches remotas: `main`, `feature/10-modelar-agregado-scheduling` (integrada), `11-sub-02-definir-dto-...` (vazia, da Layssa). Local: só `main`.
- PRs abertos: nenhum (#16 e #17 mergeados).
- Board: nenhum item em `Ready`, `In progress` ou `Under review`. WIP 0 de 3.

## 10. DoR da SUB-06 (#15)

| Critério | Avaliação | Evidência / pendência |
| --- | --- | --- |
| DoR-01 Objetivo | Atende | "Validar o comportamento do caso de uso principal e dos cenários negativos" |
| DoR-02 Escopo | Atende com ressalva | Fala em testes unitários e E2E; o teste integrado de backend (Nível C) não está explícito, mas cabe em "testes do endpoint de criação" |
| DoR-03 CAs verificáveis | Atende | 4 CAs (fluxo principal, <24h, conflito, catálogo) |
| DoR-04 Dependências | Atende com ressalva | Referências incorretas "#7, #8, #9, #N, #N" (o correto é #10 a #14). SUB-03/04/05 abertas, mas a Issue admite definir cenários em paralelo, e o fluxo funcional já existe no código |
| DoR-05 Informações | Atende | Contratos e rota disponíveis (seção 4) |
| DoR-06 Responsável | Não atende | Sem assignee; corpo cita Guilherme |
| DoR-07 Revisão | Não atende | Nenhum comentário de revisão na #15 |

## 11. Pendências e condições

| # | Pendência | Ação |
| --- | --- | --- |
| 1 | DoR-06 | Atribuir João à #15 e atualizar papéis no corpo (João responsável, Layssa revisora) |
| 2 | DoR-04 | Corrigir as referências de dependência para #10 a #14 |
| 3 | DoR-07 | Aprovação da revisora (`LayssaRD`) na #15 |
| 4 | Coordenação SUB-04 | Comentar na #13 que um `InMemorySchedulingRepository` será adicionado para testes, sem alterar o provider de produção |
| 5 | Pendências herdadas | RN05 → 500 via HTTP (SUB-05); 07-07/07-08 sem o registro do merge do PR #17 (adiado pela equipe) |

Condições técnicas atendidas: arquitetura recuperada, contratos identificados, linha de base verde, viabilidade comprovada. O código depende de regularizar as pendências 1 a 3.

### Regularização (17/11/2026)

| Pendência | Situação |
| --- | --- |
| 1 DoR-06 | Resolvida: assignee `JPZS-Git`; corpo da #15 atualizado (João responsável, Layssa revisora) |
| 2 DoR-04 | Resolvida: dependências corrigidas para #10 a #14 |
| 3 DoR-07 | Resolvida: comentário de `LayssaRD` na #15 em 2026-11-17T18:01:51Z ("Issue revisada e aprovada") |
| 4 Coordenação SUB-04 | Resolvida: comentário de `JPZS-Git` na #13 em 2026-11-17T17:58:27Z |

A #15 foi movida `Todo → Ready → In progress` (WIP 1 de 3). Branch `feature/15-teste-integrado-backend` criada a partir da `main` (`b3ac5be`), depois de `git fetch --prune` e de confirmar que não havia branch vinculada à #15.
