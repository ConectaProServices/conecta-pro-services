# 09-08 - Versionamento e Checklist Consolidado

## 1. Projeto

Conecta Pro Services (`ConectaProServices/conecta-pro-services`), backend NestJS em `conecta-pro-services-backend/`.

## 2. Caso de uso

UC01 - Solicitar Agendamento.

## 3. Issue e Sub-Issue

Epic #1. Sub-Issue trabalhada: **SUB-04, #13** - Implementar persistência do agendamento. Executada por João (`JPZS-Git`) e revisada por Layssa (`LayssaRD`). DoR-07: comentário de `LayssaRD` em 2026-11-17T18:21:58Z.

## 4. Resumo do diagnóstico inicial

A infraestrutura TypeORM (entidade ORM, mapper, adaptador, migration, DataSource da CLI) já existia na `main`, criada fora do fluxo da SUB-04. Problemas encontrados: `synchronize: true`; migration nunca aplicada; banco local sem histórico e sem a constraint de INV-1; entidade ORM sem a constraint (drift); nenhum banco de testes isolado; `compose.yaml` (5432) divergente do container (5435). Linha de base: 21/21 e 3/3 (09-01).

## 5. Contratos preservados

`Scheduling` (domínio), `ISchedulingRepository` + `SCHEDULING_REPOSITORY`, `SchedulingService.requestScheduling`, `SchedulingController` (`POST /schedulings`), `RequestSchedulingDto`, `IServiceCatalog` + `SERVICE_CATALOG`. Nenhum desses arquivos foi alterado.

## 6. Ambientes PostgreSQL

| Ambiente | Banco | Usuário | Observação |
| --- | --- | --- | --- |
| Desenvolvimento | `conecta_dev` (novo) | `conecta_user` | Migration aplicada; `.env` local `DB_NAME=conecta_dev` |
| Testes | `conecta_test` (novo) | `conecta_test_user` (novo, sem privilégios administrativos) | `TEST_DB_*`; sem acesso aos bancos de dev (`42501`) |
| Legado | `conecta_db` | `conecta_user` | Intacto (criado pelo `synchronize`) |

Container único `conecta-postgres` (`localhost:5435` → 5432 interno). Detalhes em 09-02.

## 7. Entidade ORM

`SchedulingEntity` (`scheduling.schedulings`), separada do domínio. Ajustes: `@Exclusion('EXCL_schedulings_no_overlap', ...)` e `primaryKeyConstraintName: 'PK_schedulings_schedulingId'` (09-04).

## 8. Mapper

`SchedulingOrmMapper.toPersistence` / `toDomain`, sem alteração e sem regras de negócio (09-04 §5).

## 9. Migration

`CreateSchedulings1793060000000` (sem alteração). Aplicada em `conecta_dev` (CLI) e `conecta_test` (`runMigrations()` no teste). `migration:show` → `[X]`; `migration:generate --dryrun` → "No changes".

## 10. Adaptador TypeORM

`TypeOrmSchedulingRepository implements ISchedulingRepository` (sem alteração): `Repository<SchedulingEntity>`, mapper na entrada e na saída, tradução de `23P01` → `SchedulingConflictException` (09-05).

## 11. Provider e módulo

`TypeOrmModule.forFeature([SchedulingEntity])` + `{ provide: SCHEDULING_REPOSITORY, useExisting: TypeOrmSchedulingRepository }`. Já existia; preservado.

## 12. Testes

| Suíte | Resultado |
| --- | --- |
| `pnpm test` (unitários, HTTP mock, integrado em memória) | 21/21, sem banco |
| `pnpm test:integration` (novo, `conecta_test`) | 5/5 (1ª e 2ª execução) |
| `pnpm test:e2e` | 3/3 (contra `conecta_dev`) |

## 13. Persistência e durabilidade

`POST /schedulings` → 201, `schedulingId 2d3724d1-4159-4d99-b7ff-461b10c48c84`. `SELECT` antes do reinício; backend PID 3392 encerrado com o Postgres ativo; backend PID 16124 iniciado; `SELECT` depois idêntico (`diff` → `IDENTICOS`). Detalhes em 09-06.

## 14. Salvaguardas

- Nenhum `DROP`, `TRUNCATE`, `migration:revert`, `docker compose up/down` ou remoção de volume.
- Containers e volumes de outros projetos não tocados.
- Verificação de destino e histórico antes de `migration:run`.
- Helper de testes recusa banco sem `_test`, `DB_NAME` igual e usuário de dev; valida identidade antes das migrations; limpeza só dos IDs criados; `destroy()` em `finally`.
- Senhas geradas localmente, só no `.env` (ignorado). Varredura do diff staged: 0 ocorrências das senhas e nenhum `.env`.

## 15. Estratégia de branch

`feature/13-persistencia-postgresql` criada a partir da `main` (`f943305`), depois de `git fetch --prune` e de confirmar que não havia branch vinculada à #13. Todo o código do UC01 já estava na `main`; não há cadeia dependente.

## 16. Commits (hashes reais)

| Hash | Mensagem |
| --- | --- |
| `b1fa606` | `fix(persistence): disable synchronize and align ORM entity with migration (ref #13)` |
| `016b2a9` | `test(persistence): add PostgreSQL integration tests on isolated test database (ref #13)` |
| `afe1240` | `docs: add Material 09 artifacts and prompt (ref #13)` |

Um commit posterior adiciona este artefato.

```text
$ git push -u origin feature/13-persistencia-postgresql
 * [new branch]      feature/13-persistencia-postgresql -> feature/13-persistencia-postgresql
```

## 17. Pull Request

| Item | Valor |
| --- | --- |
| Número | #19 |
| URL | https://github.com/ConectaProServices/conecta-pro-services/pull/19 |
| Título | `[SUB-04] Persistência real: synchronize desativado, migration aplicada e testes com PostgreSQL` |
| Estado | Open. Criado como **Draft**; marcado "Ready for review" em 17/11/2026 (`gh pr ready 19`) |
| Base / origem | `main` ← `feature/13-persistencia-postgresql` |
| Vínculo | `Closes #13` (verificado: `closingIssuesReferences = [13]`), por decisão da equipe, já que os 3 CAs da SUB-04 foram comprovados |
| Revisora | `LayssaRD` |

## 18. GitHub Project

| Item | Status |
| --- | --- |
| #13 SUB-04 | `Under review` (`Todo → Ready → In progress → Under review`) |
| PR #19 | `Under review` |
| #15 SUB-06 | `Under review` (desatualizado desde o merge do PR #18; não alterado, decisão pendente da equipe) |
| WIP | 2 de 3 (#13 e #15 em `Under review`) |

## 19. Checklist

### Planejamento e diagnóstico

| Item | Situação | Evidência |
| --- | --- | --- |
| 8 artefatos do Material 08 analisados | Confirmado | `docs/planejamento/08/` |
| Diretório de destino informado | Confirmado | `docs/planejamento/09/` |
| Contratos preservados | Confirmado | §5; arquivos de contrato fora do diff |
| Sub-Issue de persistência identificada | Confirmado | #13 |
| DoR verificada | Confirmado | 09-01 §6; regularizada (assignee, corpo, aprovação) |
| Dependências e WIP | Confirmado | SUB-01 fechada; SUB-03 aberta com Service já implementado; WIP 1 → 2 de 3 |
| Linha de base executada | Confirmado | 21/21 e 3/3 |
| Branch-base segura | Confirmado | §15 |

### Ambiente PostgreSQL e Docker

| Item | Situação | Evidência |
| --- | --- | --- |
| Infraestrutura inspecionada sem destruir volumes | Confirmado | 09-02 §1, §6 |
| Banco de dev identificado e verificado | Confirmado | `conecta_dev`, conexão OK |
| Banco de testes isolado | Confirmado | `conecta_test` + `conecta_test_user` |
| Portas e `inet_server_port()` compreendidos | Confirmado | `client_port=5435`, `inet_server_port=5432` |
| Credenciais protegidas | Confirmado | Senhas só no `.env`; varredura do diff = 0 |
| Conexão comprovada | Confirmado | 09-02 §4 |

### TypeORM, entidade ORM e migrations

| Item | Situação | Evidência |
| --- | --- | --- |
| `AppModule` preservado | Confirmado | Só a linha do `synchronize` mudou |
| `DataSource` verificado | Confirmado | 09-03 §3 |
| `synchronize: false` em todos os ambientes | Confirmado | `AppModule`, CLI e DataSource de testes |
| Entidade ORM separada do domínio | Confirmado | 09-04 §1 |
| Mapper sem regras de negócio | Confirmado | 09-04 §5 |
| Migration concorda com a entidade | Confirmado | Dry-run "No changes" |
| Migration aplicada no banco correto | Confirmado | `DB_NAME=conecta_dev` explícito; `migration:show` antes e depois |
| Histórico e esquema verificados via SQL | Confirmado | `public.migrations`, `\d`, `pg_constraint` |

### Adaptador e providers

| Item | Situação | Evidência |
| --- | --- | --- |
| Adaptador com tipagem completa | Confirmado | `Repository<SchedulingEntity>`, `Promise<Scheduling>` |
| Assinatura do contrato preservada | Confirmado | 09-05 §2 |
| Imports TS/ESM | Confirmado | `.js` relativos; build ok |
| Compilação sem erros | Confirmado | `pnpm build` |
| Provider com `forFeature` | Confirmado | `SchedulingModule` (preexistente) |
| Aplicação inicializada | Confirmado | Logs em 09-05 §5 e 09-06 |
| Testes em memória preservados e independentes | Confirmado | 8/8 sem banco |

### Persistência e durabilidade

| Item | Situação | Evidência |
| --- | --- | --- |
| Cadastro HTTP com PostgreSQL real | Confirmado | 201 |
| Registro consultado via SQL | Confirmado | `SELECT ... WHERE "schedulingId" = '2d3724d1-...'` |
| UUID confirmado no banco | Confirmado | idem |
| Backend encerrado e reiniciado (Postgres ativo) | Confirmado | PID 3392 → 16124; container `healthy` |
| Consulta após reinício | Confirmado | 09-06 passo 6 |
| Durabilidade comprovada | Confirmado | `diff` idêntico |

### Testes com PostgreSQL real

| Item | Situação | Evidência |
| --- | --- | --- |
| Banco exclusivo de testes | Confirmado | `conecta_test` |
| Identidade validada antes de migrations e limpezas | Confirmado | `assertTestDatabaseIdentity` antes de `runMigrations` |
| Teste em arquivo único e completo | Confirmado | `typeorm-scheduling.repository.integration-spec.ts` |
| `synchronize: false` + `destroy()` seguro | Confirmado | Helper + `afterAll`/`finally` |
| Teste executado e aprovado | Confirmado | 5/5 |
| Suíte anterior sem regressões | Confirmado | 21/21, 3/3 |

### Versionamento e GitHub

| Item | Situação | Evidência |
| --- | --- | --- |
| Alterações inspecionadas | Confirmado | `git status`, `git diff`, `git diff --staged` |
| Arquivos selecionados, sem credenciais | Confirmado | Adição por caminho; varredura = 0 |
| Commits com hashes reais | Confirmado | §16 |
| Branch publicada | Confirmado | Push `[new branch]` |
| PR com rastreabilidade | Confirmado | #19 |
| Project atualizado | Confirmado | §18 |
| Sem merge prematuro e 8 artefatos salvos | Confirmado | PR #19 aberto, aguardando revisão; `09-01` a `09-08` |

### Transparência

Comandos, consultas, testes e commits foram executados pelo assistente no ambiente local do estudante, com saídas reais. O estudante autorizou cada ação no GitHub, a criação dos bancos e o commit/PR. A aprovação da DoR é humana (`LayssaRD`). A revisão do PR #19 está pendente; nenhuma análise de IA foi apresentada como revisão humana.

## 20. Pendências abertas

1. Revisão humana do PR #19 e merge autorizado. Ao mergear, a #13 fecha.
2. README: documentar `pnpm typeorm migration:run` e `pnpm test:integration` (necessários com `synchronize: false`).
3. `compose.yaml` (5432) × container (5435): parametrizar a porta.
4. Senha de desenvolvimento versionada no `compose.yaml`.
5. E2E apontando para o banco de dev (sugestão: banco de testes; SUB-06).
6. Contrato `findScheduleById(): Promise<any | null>` (warning de lint).
7. `conecta_db` legado: decidir se será removido (requer autorização explícita).
8. #15 em `Under review` com o PR já mergeado; 07-07/07-08 e 08-08 sem registro dos merges (adiados pela equipe).
9. RN05 → 500 via HTTP (SUB-05, #14).

## 21. Próximas ações

- Revisão e merge do PR #19 (fecha a SUB-04).
- SUB-05 (#14): mapear `SameParticipantSchedulingException` e revisar os contratos de erro.
- SUB-06 (#15): E2E de conflito e catálogo inexistente, em banco de testes.
- SUB-03 (#12): revisar formalmente o `SchedulingService` (implementado fora do fluxo da Sub-Issue).
- Configurar CI separando `test`, `test:integration` (com serviço PostgreSQL) e `test:e2e`.
