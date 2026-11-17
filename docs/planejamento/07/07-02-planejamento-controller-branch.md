# 07-02 - Planejamento HTTP e Branch

## 1. Issues relacionadas

- Epic: #1 - `[UC01] Solicitar Agendamento`
- Sub-Issue trabalhada: #11 - `[SUB-02] Definir DTO de entrada e endpoint HTTP de criação`
- Sub-Issues relacionadas: #10 (SUB-01, fechada), #12 (SUB-03), #13 (SUB-04), #14 (SUB-05, coordenação no filtro), #15 (SUB-06)
- Responsável: João Pedro Zanette Sartori
- Revisora: Layssa Rodrigues Alves

## 2. Topologia Git verificada (17/11/2026)

```text
main (d61920f)  <- Merge pull request #16 (SUB-01 / Material 04-06)
  |
  +-- feature/10-modelar-agregado-scheduling   (integrada; PR #16 MERGED)
```

- O serviço GREEN (`SchedulingService.requestScheduling`), o agregado com RN05 e todos os contratos (`SCHEDULING_REPOSITORY`, `SERVICE_CATALOG`) estão na `main`.
- Não há PRs abertos.
- Estratégia de integração do Material 06: PR único, sem cadeia de PRs dependentes.

### Correção: branch duplicada para a SUB-02

A verificação original não rodou `git fetch` e deixou de ver a branch `11-sub-02-definir-dto-de-entrada-e-endpoint-http-de-criação`, criada por `LayssaRD` às 16:55 UTC a partir da Issue #11. Ela é vazia (igual a `d61920f`) e está vinculada à Issue. A branch `feature/11-endpoint-http-solicitar-agendamento` foi criada depois (17:25 UTC), gerando duas branches para a mesma Sub-Issue.

**Decisão da equipe (17/11/2026):** manter `feature/11-endpoint-http-solicitar-agendamento` e o PR #17. Motivos: segue o padrão `feature/<issue>-<descrição>` da SUB-01, já contém todo o trabalho, e o `Closes #11` do PR vincula a Issue. A branch vazia da Layssa só será removida com a concordância dela.

```text
main (d61920f)
  |
  +-- 11-sub-02-definir-dto-de-entrada-e-endpoint-http-de-criação   (LayssaRD, vazia; não usada)
  +-- feature/11-endpoint-http-solicitar-agendamento                (SUB-02, PR #17)
```

## 3. Branch de trabalho e justificativa (Refinamento 2)

- **Nova branch:** `feature/11-endpoint-http-solicitar-agendamento`
- **Branch-base:** `main` (`d61920f`)

Justificativa:

1. A regra "não ramificar da `main` se o serviço não estiver nela" não se aplica, porque o serviço **está** na `main`, integrado pelo PR #16.
2. Ramificar de `feature/10-...` não traria nada novo, já que ela foi integrada, e criaria uma cadeia artificial.
3. Ramificar da `main` deixa **todos os commits da branch exclusivos da SUB-02**, sem commits herdados a separar.
4. Nenhum merge na `main` é necessário para criar a branch.

Árvore planejada:

```text
main (d61920f)
  |
  +-- feature/11-endpoint-http-solicitar-agendamento   (SUB-02, #11)
```

## 4. Estratégia de Pull Request

- Origem: `feature/11-endpoint-http-solicitar-agendamento`, destino: `main`
- Abrir como **Draft** após os testes passarem; passar para "Ready for review" quando as evidências estiverem anexadas.
- Corpo com `Closes #11`, referência à Epic #1 e nota de coordenação com a #14.
- Revisora: Layssa. Merge somente após revisão humana aprovada e autorização formal da equipe.
- Board: #11 `Todo → Ready` (após DoR) `→ In progress` (início do código) `→ Under review` (PR aberto para revisão). Nunca `Done` antes do merge autorizado.

## 5. Matriz de planejamento técnico

| Componente | Responsabilidade | Arquivo (caminho real) | Contrato associado | Sub-Issue | Alteração prevista | Dependências | Critério de aceite | Verificação necessária |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Controller HTTP | Receber `POST /schedulings` e delegar ao serviço | `src/modules/scheduling/controllers/scheduling.controller.ts` | `SchedulingService.requestScheduling(input: RequestSchedulingDto)` | #11 | Manter (já delega corretamente); revisão de conformidade | Serviço + DTO | CA2: status adequado em sucesso (201) | Teste HTTP + requisição real |
| DTO de entrada | Validar estrutura do payload | `src/modules/scheduling/dtos/request-scheduling.dto.ts` | `{ customerId, serviceId, professionalId: UUID; startsAt: Date }` | #11 | Manter campos e decoradores; ajuste só se a verificação revelar lacuna | `class-validator`, `class-transformer` | CA1: aceita UUID e data válidos | Teste 400 + requisição inválida |
| `ValidationPipe` | Validação automática na fronteira | `src/main.ts` | Metadados do DTO | #11 | **Configurar globalmente** `{ whitelist: true, transform: true }` | `@nestjs/common` | CA3: obrigatórios validados antes da regra de negócio | Rejeição 400 sem chamar o serviço |
| Filtro de exceções | Não converter `HttpException` em 500 | `src/common/filters/domain-http-exception.filter.ts` + `src/main.ts` | Status HTTP de erros | #14 (coordenado) | **Ajuste mínimo**: repassar `HttpException`; registrar globalmente | Pipe + filtro | CA3 no app real | Requisição inválida retorna 400 com mensagens do pipe |
| Módulo / Providers | Compor Controller, Service, Repository e Catalog | `src/modules/scheduling/scheduling.module.ts`, `src/app.module.ts` | `SCHEDULING_REPOSITORY` → `TypeOrmSchedulingRepository`; `SERVICE_CATALOG` → `InMemoryServiceCatalog` | #11 | Nenhuma (já compostos); apenas verificar | Postgres local (SUB-04 já entregue) | App inicializa e mapeia a rota | Logs `InstanceLoader` / `RouterExplorer` |
| Testes HTTP | Exercitar a fronteira com serviço mockado (201 e 400) | `src/modules/scheduling/controllers/scheduling.controller.spec.ts` (novo) | Rota + DTO + contrato de resposta | #11 (complementa #15) | Criar suíte Vitest + Supertest | `@nestjs/testing`, `supertest`, `vi.fn()` | CA1, CA2, CA3 | `pnpm test` verde, sem regressões; `pnpm test:e2e` verde |

O arquivo de teste fica em `src/...` com sufixo `.spec.ts` para entrar no `pnpm test` padrão sem exigir banco, ao contrário dos `*.e2e-spec.ts`.

## 6. Riscos, decisões e pendências

| Tipo | Item | Tratamento |
| --- | --- | --- |
| Decisão | João executa e Layssa revisa (inversão em relação a `02-03`) | Refletir na Issue #11 |
| Decisão | Ajuste mínimo do filtro (SUB-05) entra nesta branch | Registrar na Issue #14. Mapeamento de RN05 permanece na SUB-05 |
| Decisão | Usar o Postgres local existente (`conecta-postgres`, porta 5435) em vez de repositório em memória | A persistência real já existe (SUB-04). Nenhum contrato é alterado; `.env` local não versionado |
| Risco | `whitelist: true` pode afetar o e2e existente, que usa só `transform: true` | O DTO declara todos os campos esperados; reexecutar `pnpm test:e2e` |
| Risco | `@Catch()` genérico do filtro mascara erros HTTP | Corrigido pelo ajuste mínimo; coberto pelo teste 400 |
| Risco | RN05 continua resultando em 500 no app real | Fora do escopo; pendência explícita da SUB-05 |
| Pendência | DoR-06 e DoR-07 da #11 | Bloqueiam alterações de código de produção até serem regularizadas |
