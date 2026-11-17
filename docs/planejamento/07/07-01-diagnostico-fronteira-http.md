# 07-01 - Diagnóstico da Fronteira HTTP

## 1. Identificação

- Projeto: Conecta Pro Services
- Caso de uso: UC01 - Solicitar Agendamento
- Issue principal (Epic): #1 - `[UC01] Solicitar Agendamento` (aberta)
- Sub-Issue da fronteira HTTP: #11 - `[SUB-02] Definir DTO de entrada e endpoint HTTP de criação` (aberta)
- Stack: NestJS 12, TypeScript 6, Vitest 4, Supertest 7, pnpm, TypeORM + PostgreSQL 17
- Diretório do backend: `conecta-pro-services-backend/`
- Diretório desta etapa: `docs/planejamento/07/`
- Data da verificação: 17/11/2026

## 2. Mapeamento das Sub-Issues e delimitação de responsabilidades (Refinamento 1)

| Sub-Issue | Issue | Estado no GitHub | Escopo | Relação com esta etapa |
| --- | --- | --- | --- | --- |
| SUB-01 - Agregado `Scheduling` | #10 | Fechada (PR #16 mergeado) | Entidade, status inicial, RN05 | Fornece o contrato de domínio. Não será alterada. |
| **SUB-02 - DTO e endpoint HTTP** | **#11** | **Aberta** | Controller, `RequestSchedulingDto`, validação de entrada, resposta de sucesso | **Sub-Issue trabalhada nesta etapa** |
| SUB-03 - Regra de negócio da solicitação | #12 | Aberta | `SchedulingService.requestScheduling`, RN01, RN03, INV-1 | O serviço já existe no código e será reutilizado sem alterações. Nenhuma regra nova entra aqui. |
| SUB-04 - Persistência | #13 | Aberta | Entidade TypeORM, repositório, PostgreSQL | Já implementada no código (`TypeOrmSchedulingRepository`). Só é usada para subir o app. |
| SUB-05 - Exceções e contratos de erro | #14 | Aberta | `DomainHttpExceptionFilter`, status HTTP de erros de domínio | Coordenação necessária (ver §8) |
| SUB-06 - Testes automatizados do UC01 | #15 | Aberta | Testes unitários e E2E do UC01 | Os testes HTTP com serviço mockado desta etapa complementam a SUB-06, sem substituí-la |

### Delimitação

- **DTO (SUB-02):** `RequestSchedulingDto` já existe e pertence à própria SUB-02. Não há outra Sub-Issue de DTO.
- **Validação HTTP vs. regra de negócio:** a SUB-02 cobre formato do payload (UUIDs, data, obrigatoriedade). Antecedência de 24h (RN01), conflito (INV-1), serviço inexistente e RN05 continuam na camada de domínio/aplicação (SUB-01/SUB-03).
- **Serviço (SUB-03):** reutilizar `requestScheduling` como está, sem mudar a assinatura.
- **Erros de domínio (SUB-05):** o mapeamento de exceções de domínio para status HTTP pertence à SUB-05.

## 3. Responsável e revisor

| Papel | Planejado (`01-04`, `02-03`, corpo da Issue #11) | Decisão da equipe para esta etapa |
| --- | --- | --- |
| Responsável | Layssa Rodrigues Alves | **João Pedro Zanette Sartori** |
| Revisora | João Pedro Zanette Sartori | **Layssa Rodrigues Alves** |

A inversão de papéis foi decidida pela equipe nesta etapa e preserva a segregação de funções: quem revisa é diferente de quem implementa. Ainda precisa ser refletida na Issue #11, que hoje está sem assignee e com os papéis antigos no corpo.

Divergência documental preexistente, fora do escopo desta etapa: a SUB-03 aparece com responsável Guilherme em `01-04` e João em `02-03`.

## 4. Contratos existentes recuperados

### Entidade (SUB-01)

`src/modules/scheduling/entities/scheduling.entity.ts`

- `Scheduling(schedulingId, customerId, serviceId, professionalId, startsAt, endsAt, status, createdAt, updatedAt, deletedAt)`
- Fábrica `Scheduling.request(props: RequestSchedulingProps, now?: Date): Scheduling`, que lança `SameParticipantSchedulingException` (RN05) e `SchedulingTooSoonException` (RN01)
- `getStatus(): SchedulingStatus`; o status inicial é `PENDING`

### Serviço de aplicação

`src/modules/scheduling/services/scheduling.service.ts`

```typescript
async requestScheduling(input: RequestSchedulingDto): Promise<{
  schedulingId; customerId; serviceId; professionalId;
  startsAt; endsAt; status; message
}>
```

Lança `CatalogServiceNotFoundException` e `SchedulingConflictException`, além das exceções do agregado.

### Repositório e token

`src/modules/scheduling/repositories/scheduling.repository.interface.ts`

- Token: `SCHEDULING_REPOSITORY = Symbol('SCHEDULING_REPOSITORY')`
- `ISchedulingRepository`: `findScheduleById`, `existsOverlapping`, `save`
- Implementação registrada: `TypeOrmSchedulingRepository` (`useExisting`)

### Porta de catálogo

- Token: `SERVICE_CATALOG`; `IServiceCatalog.findById(serviceId)`
- Implementação: `InMemoryServiceCatalog`, com um serviço demo `33333333-3333-4333-8333-333333333333` de 60 min

## 5. Estado atual da fronteira HTTP no código

| Componente | Arquivo | Situação |
| --- | --- | --- |
| Controller | `src/modules/scheduling/controllers/scheduling.controller.ts` | Existe (commit `8c0a19f`). `POST /schedulings`, `@HttpCode(201)`, delega para `requestScheduling(dto)` sem lógica própria |
| DTO | `src/modules/scheduling/dtos/request-scheduling.dto.ts` | Existe. `@IsUUID` + `@IsNotEmpty` nos três IDs; `@Type(() => Date)` + `@IsDate` em `startsAt` |
| `ValidationPipe` | `src/main.ts` | **Ausente.** Só é configurado dentro do teste E2E. No app real, payload inválido chega ao serviço |
| Filtro de exceções | `src/common/filters/domain-http-exception.filter.ts` | `@Catch()` sem argumentos **captura também `HttpException`**, então o `BadRequestException` do pipe viraria 500. Não está registrado no `main.ts`. Não mapeia `SameParticipantSchedulingException` |
| Módulo | `src/modules/scheduling/scheduling.module.ts` | Controller e providers registrados; `SchedulingModule` importado no `AppModule` |
| Teste HTTP | `test/scheduling/request-scheduling.e2e-spec.ts` | E2E com Postgres real (201 e 422). **Não existe** teste da fronteira com serviço mockado, nem cenário 400 |

## 6. Dependências de pacotes (`package.json`)

| Pacote | Versão declarada | Situação |
| --- | --- | --- |
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | ^12.0.1 | Instalado |
| `class-validator` | ^0.15.1 | Instalado |
| `class-transformer` | ^0.5.1 | Instalado |
| `@nestjs/testing` | ^12.0.1 | Instalado |
| `supertest` / `@types/supertest` | ^7.0.0 | Instalado |
| `vitest` | ^4.1.2 | Instalado (runner: usar `vi.fn()`) |

Scripts: `pnpm test` roda `**/*.spec.ts` e `pnpm test:e2e` roda `**/*.e2e-spec.ts`.

## 7. Matriz da Definition of Ready - SUB-02 (#11)

| Critério | Avaliação | Evidência / pendência |
| --- | --- | --- |
| DoR-01 Objetivo definido | Atende | "Expor a funcionalidade de criação do agendamento de forma padronizada pela API" |
| DoR-02 Escopo delimitado | Atende | Controller, DTO com validações de tipo/UUID, resposta de sucesso |
| DoR-03 Critérios de aceite verificáveis | Atende | 3 CAs verificáveis por requisição/teste HTTP |
| DoR-04 Dependências identificadas | Atende | Depende da SUB-01, que está fechada. A referência "SUB-01 (#7)" foi corrigida para #10 no corpo da Issue em 17/11/2026 |
| DoR-05 Informações disponíveis | Atende com ressalva | Payload e contratos disponíveis no código. A rota `POST /schedulings` e o status 201 vêm do código existente, não da Issue; `02-06` pedia confirmar rota/resposta no GitHub |
| DoR-06 Responsável definido | Atende | Assignee `JPZS-Git` adicionado; corpo da Issue atualizado: João responsável, Layssa revisora (17/11/2026) |
| DoR-07 Revisão de planejamento concluída | Atende | Comentário de `LayssaRD` na #11 em 2026-11-17T17:18:54Z: "Issue revisada e aprovada" |

**Resultado consolidado:** DoR atendida. A #11 foi movida `Todo → Ready → In progress` no Project em 17/11/2026, com WIP em 1 de 3.

### Considerações práticas

- Serviço GREEN disponível: **sim**, na `main` (`d61920f`, merge do PR #16).
- SUB-01, da qual a SUB-02 depende: **fechada**.
- Contrato de entrada definido: **sim** (4 campos).
- Limite de WIP (máximo 3 em `In Progress`, `planejamento-operacional.md` §3.3): **atendido**. No Project "ConectaProServices - Backlog", nenhuma Issue está em `In progress` (consulta via `gh project item-list` em 17/11/2026).
- Situação no Project: #11 (SUB-02) em `Todo`; #12 a #15 em `Todo`; #10 e PR #16 em `Done`; Epic #1 em `Todo`. Estados reais do board: `Todo → Ready → In progress → Under review → Done` (equivalentes a Backlog → Ready → In Progress → In Review → Done do material).
- Bloqueios técnicos: nenhum. Postgres local ativo (`conecta-postgres`, porta 5435).

## 8. Proposta de coordenação com a SUB-05 (decisão registrada)

Para a fronteira HTTP cumprir o CA "campos obrigatórios são validados antes da execução da regra de negócio" no **app real**, a branch da SUB-02 incluirá:

1. Registro global do `ValidationPipe` em `main.ts` (escopo da SUB-02).
2. Ajuste mínimo no `DomainHttpExceptionFilter` para **repassar `HttpException`** com o status original, para o 400 não virar 500, e registro global do filtro em `main.ts`. Isso toca um arquivo da SUB-05 e será registrado na Issue #14.

Fica fora e permanece na SUB-05: mapear `SameParticipantSchedulingException` (RN05) para um status HTTP.

## 9. Situação atual dos testes (execução real em 17/11/2026, `main` em `d61920f`)

```text
$ pnpm test
 Test Files  4 passed (4)
      Tests  11 passed (11)
   Duration  1.12s
```

```text
$ pnpm test:e2e
 Test Files  2 passed (2)
      Tests  3 passed (3)
   Duration  2.30s
```

Ambas as execuções exibiram somente o aviso do plugin `vite-tsconfig-paths`.

## 10. Branches e Pull Requests

- Branch local atual: `main` (`d61920f`), limpa.
- `feature/10-modelar-agregado-scheduling`: integrada à `main` pelo PR #16 (MERGED).
- Pull Requests abertos: nenhum.
- Não há cadeia de branches dependentes: o serviço GREEN já está na `main`.

### Correções registradas após revisão contra o GitHub (17/11/2026)

- **Merge do PR #16:** feito em 17/11/2026 às 16:48 UTC por `JPZS-Git`, antes desta etapa. A #10 foi fechada às 16:55 UTC. Isso **diverge da "Decisão C - integração não recomendada"** do `06-07` e do `06-08`, que pediam revisão humana e autorização formal antes do merge. O PR #16 não tem reviews registradas. A divergência fica documentada aqui; esta etapa parte do estado real da `main`.
- **Branch da SUB-02 não detectada no diagnóstico:** `LayssaRD` criou a branch `11-sub-02-definir-dto-de-entrada-e-endpoint-http-de-criação` às 16:55 UTC pelo botão "Create a branch" da Issue #11. Ela está vinculada à #11 em "Development" e não tem commits além da `main`. Não apareceu na listagem inicial porque o diagnóstico rodou `git branch -a` **sem `git fetch`**. É uma falha do diagnóstico.

## 11. Pendências e condições para prosseguir

| # | Pendência | Ação | Responsável |
| --- | --- | --- | --- |
| 1 | DoR-06 | Atribuir João à Issue #11 e atualizar a seção "Responsabilidades" | Equipe |
| 2 | DoR-07 | Registrar revisão/aprovação humana do planejamento da SUB-02 na Issue #11 (revisora: Layssa) | Layssa |
| 3 | WIP / Project | ~~Conceder escopo `project` ao `gh`~~ Resolvido: 0 Issues em `In progress`. Mover a #11 `Todo → Ready → In progress` após DoR-06/07 | João |
| 4 | DoR-04 | Corrigir a referência "SUB-01 (#7)" para #10 no corpo da Issue | Equipe |
| 5 | Coordenação SUB-05 | Comentar na Issue #14 o ajuste mínimo do filtro (§8) | João |

Situação das pendências em 17/11/2026: 1, 2, 4 e 5 resolvidas (assignee e corpo da #11 atualizados, aprovação de `LayssaRD` na #11, comentário de coordenação de `JPZS-Git` na #14 às 17:11). A pendência 3 também foi resolvida: #11 em `In progress`.

Condições técnicas atendidas: contratos recuperados, serviço GREEN na `main`, dependências instaladas, testes verdes, banco local disponível. **Condições para prosseguir com o código de produção: atendidas.**
