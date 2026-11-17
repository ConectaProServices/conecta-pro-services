# 08-07 - Preparação para Persistência Real

> Escopo: análise e planejamento. Nesta etapa não se implementou banco, ORM, migration nem configuração nova. **Diferença em relação ao Material 08:** neste projeto o adaptador PostgreSQL/TypeORM **já existe** no código (desde antes do Material 04), embora a SUB-04 (#13) siga em `Todo` e sem revisão formal. Este artefato registra o estado real e o que falta para a SUB-04 ser considerada concluída.

## 1. Arquitetura

### Atual (verificada nesta etapa)

```text
SchedulingController
     |
     v
SchedulingService
     |                         \
     v                          v
ISchedulingRepository          IServiceCatalog
(Token: SCHEDULING_REPOSITORY) (Token: SERVICE_CATALOG)
     |                          |
     +--> TypeOrmSchedulingRepository  (produção: SchedulingModule, useExisting)
     |         -> PostgreSQL scheduling.schedulings
     |                          +--> InMemoryServiceCatalog (produção e testes)
     +--> InMemorySchedulingRepository (testes integrados: overrideProvider)
```

Os dois adaptadores de agendamento são **alternativos** para o mesmo contrato. Em cada contexto o token resolve para exatamente um deles: TypeORM na aplicação, memória no teste integrado. Nunca gravam ao mesmo tempo na mesma requisição.

### Evolução planejada

```text
SchedulingController -> SchedulingService -> ISchedulingRepository (SCHEDULING_REPOSITORY)
                                                  |
                                                  +--> InMemorySchedulingRepository  (testes rápidos, sem infraestrutura)
                                                  +--> TypeOrmSchedulingRepository   (produção; revisão formal na SUB-04)
                                             -> IServiceCatalog (SERVICE_CATALOG)
                                                  +--> InMemoryServiceCatalog        (atual)
                                                  +--> adaptador do catálogo real    (futuro, outro UC/Sub-Issue)
```

## 2. Contratos existentes (preservados)

- `ISchedulingRepository`: `findScheduleById(id)`, `existsOverlapping(professionalId, startsAt, endsAt)`, `save(scheduling)`; token `SCHEDULING_REPOSITORY` (Symbol)
- `IServiceCatalog`: `findById(serviceId)`; token `SERVICE_CATALOG` (Symbol)
- Entidade `Scheduling` e `SchedulingService.requestScheduling(input)` sem alteração

## 3. Limitações do repositório em memória (`InMemorySchedulingRepository`)

| # | Limitação | No Conecta Pro Services |
| --- | --- | --- |
| 1 | Volatilidade | O `Map` interno é perdido a cada reinício do processo. No teste, cada `beforeEach` cria um contêiner novo e o estado zera. É desejável em teste, inviável em produção |
| 2 | Escopo da instância | Cada processo Node tem seu `Map`. Com 2 réplicas, um prestador poderia ser agendado duas vezes no mesmo horário, uma em cada réplica, quebrando a INV-1 |
| 3 | Concorrência | `existsOverlapping` seguido de `save` não é atômico. Duas requisições simultâneas podem passar pela checagem antes de qualquer gravação. No PostgreSQL, a mitigação prevista é a exclusion constraint `EXCL_schedulings_no_overlap` da migration (erro `23P01` → `SchedulingConflictException`). **Mas ela não está aplicada no banco local** (ver §5) |
| 4 | Sem transações ACID | Não há commit/rollback. Uma operação composta futura (ex.: confirmar agendamento e registrar histórico) não teria atomicidade |
| 5 | Sem constraints do SGBD | Nada impede, no armazenamento, `schedulingId` duplicado (o `Map` sobrescreve), UUIDs inválidos, `endsAt <= startsAt` ou sobreposição. Tudo depende do código da aplicação |
| 6 | Sem durabilidade nem auditoria | Sem histórico, backup ou consulta posterior. `createdAt`/`updatedAt`/`deletedAt` existem só em memória |

## 4. Componentes preservados vs. infraestrutura

**Preservados (graças à inversão de dependência):** `SchedulingController`, `RequestSchedulingDto` e validações HTTP, `SchedulingService`, `Scheduling`, `ISchedulingRepository`/`SCHEDULING_REPOSITORY`, `IServiceCatalog`/`SERVICE_CATALOG`.

**Infraestrutura (já existe no código, pendente de revisão formal na SUB-04):**

| Componente | Arquivo | Situação |
| --- | --- | --- |
| Adaptador TypeORM | `src/infraestructure/persistence/scheduling/typeorm-scheduling.repository.ts` | Existe; traduz `23P01` em `SchedulingConflictException` |
| Entidade ORM | `.../scheduling.orm-entity.ts` | `scheduling.schedulings`, colunas uuid, timestamptz, enum |
| Mapper Domínio ↔ ORM | `.../scheduling.orm-mapper.ts` | Existe |
| Conexão | `src/app.module.ts` (`TypeOrmModule.forRootAsync`) + `.env` | Existe; **`synchronize: true`** ativo |
| Migration | `src/database/migrations/1793060000000-CreateScheduling.ts` + `src/database/data-source.ts` | Existe (PK, `btree_gist`, `EXCL_schedulings_no_overlap`), mas **não aplicada** no banco local |
| Provider | `scheduling.module.ts` (`useExisting: TypeOrmSchedulingRepository`) | Existe |
| Testes com banco real | `test/scheduling/request-scheduling.e2e-spec.ts` | 2 cenários (201 persistido, 422) |

## 5. Riscos mapeados

| Risco | Impacto | Mitigação proposta (SUB-04) |
| --- | --- | --- |
| `synchronize: true` no `AppModule` | **Já ocorreu:** no banco local, `scheduling.schedulings` tem só a PK gerada pelo TypeORM (`PK_798799b02c23c20fa2df0ba37fe`). A constraint `EXCL_schedulings_no_overlap` e a PK nomeada `PK_schedulings_schedulingId`, ambas da migration `1793060000000-CreateScheduling`, **não existem**. A proteção de INV-1 contra concorrência não está ativa nesse ambiente | Desativar `synchronize`, aplicar as migrations (`pnpm typeorm migration:run`) e verificar `pg_constraint` |
| `SchedulingModule` acoplado a `TypeOrmModule.forFeature` | Módulo não carrega sem banco; testes exigem overrides (08-06) | Extrair um `SchedulingPersistenceModule` ou escolher o provider por configuração |
| Divergência semântica entre adaptadores | `existsOverlapping` em memória e no SQL podem divergir (ex.: limites do intervalo, status ativos) | Suíte de contrato comum executada contra os dois adaptadores |
| Credenciais | `.env` local; `ObserveModule` com `appKey: 'YOUR_APP_KEY'` hard-coded | Variáveis de ambiente para todos os segredos |
| SUB-04 sem revisão | Código de persistência nunca passou por DoR, revisão e PR próprios | Revisar formalmente na SUB-04 antes de marcá-la como concluída |
| Dados de teste no banco local | E2E e requisições manuais deixam registros | Banco/schema dedicado a testes, limpeza por teste |

## 6. Estratégia de testes futuros com banco real

1. **Teste de contrato do repositório:** a mesma suíte (`save`, `findScheduleById`, `existsOverlapping` com casos de borda) roda contra `InMemorySchedulingRepository` e `TypeOrmSchedulingRepository`.
2. **Integração com banco:** banco efêmero (container dedicado ou schema por execução) com migrations aplicadas e `synchronize: false`.
3. **Concorrência:** duas solicitações simultâneas para o mesmo prestador e horário devem resultar em um 201 e um 409, via constraint `23P01`.
4. **E2E:** manter `AppModule` + Postgres para os cenários do UC01 (SUB-06), com limpeza por teste.
5. **Pipeline:** separar `pnpm test` (rápido, sem banco: Níveis A, B, C) de `pnpm test:e2e` (com banco) no CI, que ainda não existe.

## 7. Rastreabilidade

- **Sub-Issue de persistência:** SUB-04, #13 (aberta, `Todo`, sem assignee). Este planejamento **não** a inicia nem a conclui. Nenhuma branch de persistência foi criada e o status no board não foi alterado.
- A coordenação sobre o `InMemorySchedulingRepository` foi registrada em comentário na #13 (17/11/2026, 17:58 UTC).
- Divergência de governança: o código da SUB-04 existe na `main` sem ter passado pelo fluxo da SUB-04.

## 8. Próximas ações sugeridas para a SUB-04

1. Abrir o ciclo da SUB-04: DoR, assignee, revisão.
2. Revisar o adaptador, a entidade ORM, o mapper e a migration existentes.
3. Desativar `synchronize: true`, aplicar a migration existente e confirmar a constraint de exclusão (consulta usada nesta etapa: `SELECT conname, contype FROM pg_constraint WHERE conrelid = 'scheduling.schedulings'::regclass;`, resultado `PK_798799b02c23c20fa2df0ba37fe | p`).
4. Criar a suíte de contrato comum aos dois adaptadores.
5. Avaliar o desacoplamento do `TypeOrmModule.forFeature` no `SchedulingModule`.
