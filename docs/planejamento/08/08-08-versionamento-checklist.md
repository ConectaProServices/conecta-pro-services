# 08-08 - Versionamento e Checklist

## 1. Versionamento (Fase 11)

### Sub-Issue e branch

- Sub-Issue: #15 (SUB-06, testes automatizados), executada por João e revisada por Layssa
- Branch: `feature/15-teste-integrado-backend`, criada a partir da `main` (`b3ac5be`)
- Justificativa: Controller, DTO, `ValidationPipe`, Module, Service e entidade já estão na `main` (PRs #16 e #17 mergeados). Não há cadeia de branches dependentes.
- Verificação prévia: `git fetch --prune` e consulta de `linkedBranches` da #15 (nenhuma). Isso evita a duplicidade ocorrida no Material 07.

### Inspeção antes do commit

```text
$ git status --short
?? conecta-pro-services-backend/src/infraestructure/persistence/scheduling/in-memory-scheduling.repository.ts
?? conecta-pro-services-backend/src/modules/scheduling/scheduling.integration.spec.ts
?? docs/planejamento/08/
?? docs/prompts/08-verificacao-integrada-do-backend-e-preparacao-para-persistencia-real.md

$ git diff --stat
(vazio: nenhum arquivo versionado foi modificado)
```

Adição seletiva por caminho (sem `git add .`). O `.env` local não entra (`.gitignore`).

### Commits (hashes reais, `git log --oneline main..HEAD`)

| Hash | Mensagem |
| --- | --- |
| `5c2ef8b` | `test(scheduling): add in-memory repository adapter for integration tests (ref #15)` |
| `fe33606` | `test(scheduling): add integrated backend tests for POST /schedulings (ref #15)` |
| `be758ac` | `docs: add Material 08 artifacts and prompt (ref #15)` |

Um commit posterior adiciona este artefato.

### Push

```text
To https://github.com/ConectaProServices/conecta-pro-services.git
 * [new branch]      feature/15-teste-integrado-backend -> feature/15-teste-integrado-backend
```

### Pull Request

| Item | Valor |
| --- | --- |
| Número | #18 |
| Título | `[SUB-06] Teste integrado do backend para POST /schedulings (repositório em memória)` |
| URL | https://github.com/ConectaProServices/conecta-pro-services/pull/18 |
| Estado | Open, **Draft** |
| Base / origem | `main` ← `feature/15-teste-integrado-backend` |
| Vínculo | `Ref #15`. **Não** fecha a Issue (verificado: `closingIssuesReferences` vazio), por decisão da equipe, já que a SUB-06 ainda tem escopo pendente |
| Revisora | `LayssaRD` |

### GitHub Project

| Item | Status |
| --- | --- |
| #15 SUB-06 | `In progress` (`Todo → Ready → In progress` após a DoR) |
| PR #18 | `In progress` |
| #13 SUB-04 | `Todo`, **não alterado** (só recebeu o comentário de coordenação) |
| #1 Epic, #12, #14 | `Todo`, não alterados |
| WIP | 1 Issue em `In progress` (limite 3) |

Estados do board da equipe: `Todo → Ready → In progress → Under review → Done`.

## 2. Checklist (38 itens)

| # | Item | Situação | Evidência |
| --- | --- | --- | --- |
| 1 | 8 artefatos do Material 07 recebidos e analisados | Confirmado | `docs/planejamento/07/` (produzidos nesta mesma sessão) |
| 2 | Diretório de destino informado | Confirmado | `docs/planejamento/08/` |
| 3 | Arquitetura recuperada | Confirmado | 08-01 §3 |
| 4 | Contratos identificados e preservados | Confirmado | 08-01 §4; `git diff` vazio sobre arquivos existentes |
| 5 | Componentes reais disponíveis | Confirmado com ressalva | Controller, DTO, Service e Module existiam; **não havia** repositório de agendamento em memória (criado nesta etapa por decisão da equipe) |
| 6 | Linha de base executada | Confirmado | 13/13 e 3/3 (08-01 §7) |
| 7 | Resultados anteriores confirmados | Confirmado | Iguais ao 07-06 |
| 8 | Três níveis comparados em matriz | Confirmado | 08-02 |
| 9 | Módulo verificado | Confirmado | 08-03 |
| 10 | Controller real verificado | Confirmado | Teste "resolve os componentes reais" |
| 11 | Service real verificado | Confirmado | idem |
| 12 | Repositório em memória real verificado | Confirmado | `toBeInstanceOf(InMemorySchedulingRepository)` |
| 13 | Token do repositório confirmado | Confirmado | `SCHEDULING_REPOSITORY` (Symbol) |
| 14 | Cadeia de DI explicada | Confirmado | 08-03 §3 |
| 15 | Aplicação inicializada | Confirmado | Logs em 08-03 §4 |
| 16 | Requisição válida no fluxo integrado | Confirmado com ressalva | 201 via `curl` (com adaptador TypeORM); o fluxo em memória foi exercitado via Supertest (08-04 §1) |
| 17 | Requisição inválida rejeitada com 400 | Confirmado | 08-04 §3 |
| 18 | Respostas analisadas | Confirmado | 08-04 §2-4 |
| 19 | Teste integrado em arquivo único | Confirmado | `scheduling.integration.spec.ts` |
| 20 | Teste integrado no repositório | Confirmado | Commit `fe33606` |
| 21 | Teste integrado executado com sucesso | Confirmado | 8/8 |
| 22 | Service não mockado | Confirmado | Sem `useValue`/`vi.fn()` para o Service; só `vi.spyOn` de observação no cenário 400 |
| 23 | Repositório em memória não mockado | Confirmado | `useClass(InMemorySchedulingRepository)` |
| 24 | Resultados analisados | Confirmado | 08-05 §4-7 |
| 25 | Evidência de armazenamento delimitada | Confirmado | 08-05 §5; 08-04 §4 |
| 26 | Testes anteriores reexecutados | Confirmado | Nível A 4/4, Nível B 2/2 |
| 27 | Ausência de regressões | Confirmado | 21/21, 3/3, build ok |
| 28 | Falha de composição investigada | Confirmado | 08-06 §2-4 |
| 29 | Diagnóstico em contexto isolado | Confirmado | Mensagem real e teste `rejects.toThrow` |
| 30 | Seis limitações da memória analisadas | Confirmado | 08-07 §3 |
| 31 | Planejamento de persistência real | Confirmado | 08-07 |
| 32 | Nenhum banco/ORM/migration antecipado | Confirmado com ressalva | Nada de persistência foi criado ou alterado nesta etapa. A persistência TypeORM **já existia** antes (08-07) |
| 33 | Sub-Issue responsável respeitada | Confirmado | #15; SUB-04 apenas comentada, sem mudança de status |
| 34 | WIP considerado | Confirmado | 0 → 1 de 3 |
| 35 | Branch e PR corretos | Confirmado | Base `main` justificada; PR #18 |
| 36 | Commit rastreável com hash real | Confirmado | `5c2ef8b`, `fe33606`, `be758ac` |
| 37 | Project atualizado sem encerramentos | Confirmado | #15 e PR #18 em `In progress`; nada em `Done` |
| 38 | Sem merge prematuro e 8 artefatos gravados | Confirmado | PR #18 Draft; `08-01` a `08-08` em `docs/planejamento/08/` |

### Transparência

- Build, inicialização, `curl`, consultas SQL, testes e commits foram executados pelo assistente no ambiente local do estudante, com saídas reais. O estudante autorizou as ações no GitHub e o commit/PR. A aprovação de DoR-07 é humana (`LayssaRD`).
- Experimentos temporários (`zz-spike.spec.ts`, `zz-diag.spec.ts` e a remoção do provider de catálogo no módulo) foram desfeitos antes do commit e não estão no histórico.
- Nenhuma análise de IA foi apresentada como revisão humana. A revisão do PR #18 está pendente.

## 3. Relatório final consolidado (20 pontos)

| # | Ponto | Situação |
| --- | --- | --- |
| 1 | Projeto e caso de uso | Conecta Pro Services, UC01 Solicitar Agendamento |
| 2 | Sub-Issues | Testes: SUB-06 #15 (trabalhada). HTTP: SUB-02 #11 (fechada). Persistência: SUB-04 #13 (`Todo`, só planejamento) |
| 3 | Arquitetura verificada | Controller → Service → `SCHEDULING_REPOSITORY` / `SERVICE_CATALOG` → adaptadores (TypeORM em produção, memória em teste) |
| 4 | Linha de base | 13/13 (5 arquivos), e2e 3/3 |
| 5 | Níveis de teste | A (Service + mocks), B (HTTP + Service mock), C (módulo real + memória). B não substitui C, comprovado no 08-06 §4 |
| 6 | Módulos e providers | 8 pontos verificados; divergência no ponto 5 (produção usa TypeORM via `useExisting`) |
| 7 | Requisições integradas | 201 e 400 via `curl`; registro confirmado no Postgres |
| 8 | Testes integrados | 6 de fluxo + 2 de diagnóstico, em um arquivo |
| 9 | Resultados | 8/8 |
| 10 | Evolução da suíte | 13 → 21 testes; 5 → 6 arquivos; 0 regressões |
| 11 | Evidência de armazenamento | Resposta HTTP + `findScheduleById` via contrato + 409 dependente do estado; o `Map` privado não foi exposto |
| 12 | Diagnóstico de DI | `Nest can't resolve dependencies of the SchedulingService (?, Symbol(SERVICE_CATALOG))...` analisado e mantido como teste |
| 13 | Limitações da memória | Volatilidade, instância única, concorrência, sem ACID, sem constraints, sem durabilidade |
| 14 | Persistência real | Adaptador TypeORM já existe; riscos: `synchronize: true`, **constraint anti-sobreposição não aplicada no banco local**, acoplamento do módulo, SUB-04 sem revisão |
| 15 | Branch | `feature/15-teste-integrado-backend` |
| 16 | Commits | `5c2ef8b`, `fe33606`, `be758ac` (+ commit deste artefato) |
| 17 | Pull Request | #18 Draft → `main`, `Ref #15`, revisora `LayssaRD` |
| 18 | GitHub Project | #15 e PR #18 em `In progress` |
| 19 | Pendências | Tirar o PR #18 de Draft e mover para `Under review`; revisão humana; autorização de merge; RN05 → 500 (SUB-05); constraint e `synchronize` (SUB-04); 07-07/07-08 sem o registro do merge do PR #17 (adiado) |
| 20 | Próximas ações | Revisão e merge do PR #18; abrir o ciclo da SUB-04 (aplicar migration, desligar `synchronize`, suíte de contrato comum aos adaptadores); SUB-05 mapear RN05; concluir a SUB-06 com E2E de conflito e catálogo |
