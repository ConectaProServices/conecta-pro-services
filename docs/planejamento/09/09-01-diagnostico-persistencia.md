# 09-01 - Diagnóstico da Persistência e Linha de Base

## 1. Identificação

- Projeto: Conecta Pro Services
- Caso de uso: UC01 - Solicitar Agendamento (Epic #1)
- Sub-Issue de persistência: **SUB-04, #13** - `[SUB-04] Implementar persistência do agendamento`
- Backend: `conecta-pro-services-backend/` (NestJS 12, TypeORM ^1.1.2, `pg` ^8.23.1, Vitest 4, pnpm, ESM `nodenext`)
- Artefatos de origem: `docs/planejamento/08/08-01..08-08` (na `main`)
- Destino: `docs/planejamento/09/`
- Data: 17/11/2026

## 2. Contratos a preservar

| Contrato | Arquivo | Definição |
| --- | --- | --- |
| Entidade de domínio | `src/modules/scheduling/entities/scheduling.entity.ts` | `Scheduling(schedulingId, customerId, serviceId, professionalId, startsAt, endsAt, status, createdAt, updatedAt, deletedAt)`; `request()`; `getStatus()` |
| Repositório + token | `src/modules/scheduling/repositories/scheduling.repository.interface.ts` | `ISchedulingRepository { findScheduleById; existsOverlapping; save }`, `SCHEDULING_REPOSITORY` (Symbol) |
| Service | `src/modules/scheduling/services/scheduling.service.ts` | `requestScheduling(input: RequestSchedulingDto)` |
| Controller / DTO | `controllers/scheduling.controller.ts`, `dtos/request-scheduling.dto.ts` | `POST /schedulings`; 4 campos validados |
| Catálogo | `ports/service-catalog.interface.ts` | `SERVICE_CATALOG` → `InMemoryServiceCatalog` |

## 3. Infraestrutura de persistência já existente

**Diferença fundamental em relação ao Material 09:** o projeto **não parte** de um repositório em memória em produção. Toda a infraestrutura TypeORM já existe na `main` desde o commit `8c0a19f` e anteriores, criada fora do fluxo da SUB-04:

| Componente | Arquivo | Situação |
| --- | --- | --- |
| Entidade ORM | `src/infraestructure/persistence/scheduling/scheduling.orm-entity.ts` | `SchedulingEntity`, `@Entity({ name: 'schedulings', schema: 'scheduling' })`, PK `uuid` via `@PrimaryColumn` |
| Mapper | `.../scheduling.orm-mapper.ts` | `SchedulingOrmMapper.toDomain` / `toPersistence` |
| Adaptador | `.../typeorm-scheduling.repository.ts` | `TypeOrmSchedulingRepository implements ISchedulingRepository`; traduz `23P01` em `SchedulingConflictException` |
| Adaptador em memória | `.../in-memory-scheduling.repository.ts` | Material 08, usado só em testes |
| Provider | `src/modules/scheduling/scheduling.module.ts` | `TypeOrmModule.forFeature([SchedulingEntity])`; `SCHEDULING_REPOSITORY → useExisting: TypeOrmSchedulingRepository` |
| Conexão da aplicação | `src/app.module.ts` | `TypeOrmModule.forRootAsync` com `DB_*`, `autoLoadEntities: true`, **`synchronize: true`** ⚠️ |
| DataSource da CLI | `src/database/data-source.ts` | `dotenv/config`, `DB_*`, `entities: [SchedulingEntity]`, `migrations: ['src/database/migrations/*.ts']`, `synchronize: false` |
| Migration | `src/database/migrations/1793060000000-CreateScheduling.ts` | Classe `CreateSchedulings1793060000000`: schema, enum, tabela, PK nomeada, `btree_gist`, `EXCL_schedulings_no_overlap` |
| Script CLI | `package.json` → `"typeorm": "typeorm-ts-node-esm -d src/database/data-source.ts"` | Existe |
| Script de verificação | `src/scripts/verify-persistence.ts` (`pnpm verify:persistence`) | Existe; usa o `AppModule` |
| Compose | `compose.yaml` | Serviço `postgres` (`conecta-postgres`), `postgres:17`, volume `conecta_postgres_data`, healthcheck, **porta `5432:5432`** |
| Env | `.env.example` (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, vazios); `.env` local (não versionado) | Sem variáveis `TEST_DB_*` |

### Estado real do ambiente (inspecionado)

| Item | Observado |
| --- | --- |
| Container `conecta-postgres` | `Up (healthy)`, **`0.0.0.0:5435->5432/tcp`**, projeto compose `conecta-pro-services-backend`. **Diverge do `compose.yaml` (`5432:5432`)** |
| Outros containers (não tocar) | `celilac-postgres` (5434), `rentpro-postgres` (5433), de outros projetos |
| Bancos no container | `postgres`, `conecta_db` |
| Tabelas em `conecta_db` | Só `scheduling.schedulings` (2 registros de testes manuais anteriores) |
| Histórico de migrations | **Inexistente** (nenhuma tabela `migrations`) |
| Extensões | Só `plpgsql`; **sem `btree_gist`** |
| Constraints | Só `PK_798799b02c23c20fa2df0ba37fe` (gerada pelo `synchronize`); **sem `EXCL_schedulings_no_overlap`** |

Conclusão: a tabela de desenvolvimento foi criada pelo `synchronize: true`, e a migration nunca foi aplicada. Executá-la em `conecta_db` falharia (`CREATE TYPE`/`CREATE TABLE` sobre objetos existentes).

## 4. Testes existentes

| Arquivo | Nível | Testes | Banco? |
| --- | --- | --- | --- |
| `scheduling.entity.spec.ts` | Domínio | 4 | Não |
| `request-scheduling.service.spec.ts` | Unitário do Service (mocks) | 4 | Não |
| `scheduling.services.spec.ts` | Unitário do Service (mocks) | 2 | Não |
| `controllers/scheduling.controller.spec.ts` | HTTP com Service mock | 2 | Não |
| `scheduling.integration.spec.ts` | Integrado em memória (Material 08) | 8 | Não (overrides) |
| `app.controller.spec.ts` | Scaffold | 1 | Não |
| `test/scheduling/request-scheduling.e2e-spec.ts` | E2E `AppModule` | 2 | **Sim, banco de desenvolvimento** (`.env`) |
| `test/app.e2e-spec.ts` | E2E scaffold | 1 | Sim (via `AppModule`) |

Não há teste automatizado do `TypeOrmSchedulingRepository` contra um banco **de testes isolado**.

## 5. Issues, responsáveis e dependências

| Sub-Issue | Issue | Estado |
| --- | --- | --- |
| SUB-01 | #10 | Fechada / `Done` |
| SUB-02 | #11 | Fechada / `Done` |
| SUB-03 | #12 | Aberta / `Todo` (Service já implementado no código) |
| **SUB-04** | **#13** | **Aberta / `Todo`, sem assignee** |
| SUB-05 | #14 | Aberta / `Todo` |
| SUB-06 | #15 | Aberta / `Under review` (PR #18 já mergeado, ver §8) |

Decisão da equipe: **João executa a SUB-04 e Layssa revisa**. O corpo da #13 ainda cita "Responsável: Layssa / Revisor: Guilherme".

## 6. DoR da SUB-04 (#13)

| Critério | Avaliação | Evidência / pendência |
| --- | --- | --- |
| DoR-01 Objetivo | Atende | "Persistir o agendamento de forma segura e consistente em banco relacional" |
| DoR-02 Escopo | Atende | Mapeamento ORM, repositório, integração PostgreSQL |
| DoR-03 CAs | Atende | Salvar; consultar a reserva criada; persistir início, término e status |
| DoR-04 Dependências | Atende com ressalva | Corpo cita "SUB-01 (#7), SUB-03 (#9)"; o correto é #10 e #12. A SUB-03 (#12) está aberta, mas o `SchedulingService` já está implementado e testado |
| DoR-05 Informações | Atende | Planejamento em 08-07; infraestrutura existente (§3) |
| DoR-06 Responsável | Não atende | Sem assignee; corpo desatualizado |
| DoR-07 Revisão | Não atende | Só há o comentário de coordenação de `JPZS-Git` (Material 08); nenhuma revisão |

## 7. WIP

Itens em `Ready`/`In progress`/`Under review`: só a #15 (`Under review`). WIP 1 de 3 (a política conta `In Review`). Há vaga para a #13.

## 8. Linha de base (execução real)

Branch `main`, commit `f943305` (merge do PR #18):

```text
$ pnpm exec vitest run --reporter=verbose   (contagem por arquivo)
      1  ✓ src/app.controller.spec.ts
      2  ✓ src/modules/scheduling/controllers/scheduling.controller.spec.ts
      4  ✓ src/modules/scheduling/entities/scheduling.entity.spec.ts
      8  ✓ src/modules/scheduling/scheduling.integration.spec.ts
      4  ✓ src/modules/scheduling/services/request-scheduling.service.spec.ts
      2  ✓ src/modules/scheduling/services/scheduling.services.spec.ts

$ pnpm test
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  1.57s

$ pnpm test:e2e
 Test Files  2 passed (2)
      Tests  3 passed (3)

$ pnpm build   -> nest build (sem erros)
```

Resultado: igual ao final do Material 08 (21/21 e 3/3). **Linha de base verde.**

## 9. Branches e PRs

- Local: `main`. Remotas: `main`, `feature/10-...` (integrada), `11-sub-02-...` (vazia, da Layssa).
- PRs abertos: nenhum (#16, #17 e #18 mergeados).
- Branches vinculadas à #13: nenhuma (consulta `linkedBranches`).
- Todo o código do UC01 está na `main`: a branch da SUB-04 sai da `main`, sem cadeia dependente.

## 10. Decisões da equipe para esta etapa

| Tema | Decisão |
| --- | --- |
| Banco de desenvolvimento | Criar **`conecta_dev`** no container atual, aplicar a migration nele e apontar o `.env` local. `conecta_db` permanece intacto (nada é apagado) |
| Banco de testes | Criar **`conecta_test`** com usuário próprio **`conecta_test_user`** (senha distinta) no mesmo container (porta 5435), sem alterar o `compose.yaml` |
| `synchronize` | Passar para `false` no `AppModule` (obrigatório no Material 09) |

## 11. Riscos e pendências

| # | Item | Tratamento |
| --- | --- | --- |
| 1 | DoR-06 e DoR-04 da #13 | Atribuir João; corrigir papéis e dependências (#10, #12) |
| 2 | DoR-07 da #13 | Aprovação de `LayssaRD` |
| 3 | `synchronize: true` | Alterar para `false` |
| 4 | Migration não aplicada em nenhum banco | Aplicar em `conecta_dev` e `conecta_test` após verificar o destino |
| 5 | `compose.yaml` (5432) ≠ container (5435) | Registrar; propor parametrização da porta (09-02) |
| 6 | E2E usa o banco de desenvolvimento | Fora do escopo mínimo; avaliar apontá-lo para o banco de testes |
| 7 | #15 em `Under review` com PR já mergeado | Status desatualizado (decisão pendente da equipe); não será movida para liberar WIP |

Condições técnicas atendidas: contratos e infraestrutura mapeados, linha de base verde, decisões de ambiente tomadas. Alterações de código dependem das pendências 1 e 2.
