# 07-07 - Versionamento e Pull Request

## 1. Sub-Issue vinculada

- #11 - `[SUB-02] Definir DTO de entrada e endpoint HTTP de criação`
- Epic: #1 - `[UC01] Solicitar Agendamento`
- Coordenação: #14 - SUB-05 (ajuste mínimo no filtro)

## 2. Branches

| Item | Valor |
| --- | --- |
| Origem | `feature/11-endpoint-http-solicitar-agendamento` |
| Base (destino) | `main` |
| Ponto de partida | `d61920f` (merge do PR #16) |

Justificativa: o serviço GREEN e todos os contratos foram integrados à `main` pelo PR #16. A cadeia de branches dependentes não se aplica, porque não existe branch intermediária pendente. Todos os commits da branch são exclusivos da SUB-02 (ver 07-02, Refinamento 2).

Branch paralela: existe também `11-sub-02-definir-dto-de-entrada-e-endpoint-http-de-criação`, criada por `LayssaRD` a partir da Issue. Ela está vazia e não foi usada. A equipe decidiu manter esta branch e o PR #17 (ver 07-02, "Correção: branch duplicada").

## 3. Inspeção antes do commit

`git status --short` antes do commit:

```text
 M conecta-pro-services-backend/src/common/filters/domain-http-exception.filter.ts
 M conecta-pro-services-backend/src/main.ts
?? conecta-pro-services-backend/src/modules/scheduling/controllers/scheduling.controller.spec.ts
?? docs/planejamento/07/
?? docs/prompts/07-da-aplicacao-a-api-http-com-nestjs.md
```

`git diff --stat`: 2 arquivos de produção, +14/-1 (diff completo em 07-04). O `.env` local não aparece porque está no `.gitignore`.

Ocorrência: a primeira tentativa de commit falhou com `Author identity unknown` porque o Git não tinha `user.name`/`user.email` nesta máquina. O push dessa tentativa publicou a branch remota apontando para `d61920f`, sem commits novos. Depois de o estudante configurar a identidade, os commits foram criados e enviados normalmente.

## 4. Commits (hashes reais, `git log --oneline main..HEAD`)

| Hash | Mensagem | Conteúdo |
| --- | --- | --- |
| `3cb3550` | `feat(scheduling): enable global ValidationPipe and keep HttpException status (ref #11)` | `main.ts`, `domain-http-exception.filter.ts` |
| `9877321` | `test(scheduling): add HTTP boundary tests for POST /schedulings (ref #11)` | `scheduling.controller.spec.ts` |
| `ff28076` | `docs: add Material 07 HTTP boundary artifacts and prompt (ref #11)` | `docs/planejamento/07/07-01..07-06`, `docs/prompts/07-...md` |

Todos são exclusivos desta etapa; não há commits herdados de outra branch de trabalho. Um commit posterior adiciona este artefato e o 07-08.

## 5. Push remoto

```text
To https://github.com/ConectaProServices/conecta-pro-services.git
   d61920f..ff28076  feature/11-endpoint-http-solicitar-agendamento -> feature/11-endpoint-http-solicitar-agendamento
```

Nenhum push direto na `main`, nenhum `--force`.

## 6. Pull Request

| Item | Valor |
| --- | --- |
| Número | #17 |
| Título | `[SUB-02] Ativar validação HTTP em POST /schedulings e testes da fronteira` |
| URL | https://github.com/ConectaProServices/conecta-pro-services/pull/17 |
| Estado | Open. Criado como **Draft**; marcado "Ready for review" após os artefatos |
| Base / origem | `main` ← `feature/11-endpoint-http-solicitar-agendamento` |
| Vínculo | `Closes #11`; referências a #1 e #14 |
| Revisora solicitada | `LayssaRD` |
| Project | PR adicionado ao "ConectaProServices - Backlog" |

A descrição do PR contém: contexto, problema (500 na aplicação real), tabela de alterações, contratos preservados, explicação da branch sem cadeia dependente, lista de commits, evidências (requisições antes e depois, testes 13/13 e 3/3, build, lint, prova de sensibilidade), limitações (RN05 pendente na SUB-05, ausência de CI) e condições de integração.

## 7. Evidências anexadas ao PR

- Requisições reais: válida 201, inválida 400, RN01 422.
- `pnpm test` 13/13, `pnpm test:e2e` 3/3, `pnpm build` ok, `pnpm lint` com 1 warning preexistente.
- Teste 400 falha sem o ajuste do filtro (`expected 400, got 500`).

## 8. Revisão e GitHub Project

| Item | Situação |
| --- | --- |
| Revisão humana do PR | Pendente (solicitada a `LayssaRD`) |
| PR #17 | Marcado como "Ready for review" em 17/11/2026 (`gh pr ready 17`); revisão solicitada a `LayssaRD` |
| Issue #11 no Project | `Under review` (movida após o PR sair de Draft) |
| PR #17 no Project | `Under review` (antes: `Todo` → `In progress`) |
| Issue #11 | Aberta. Será fechada automaticamente pelo `Closes #11` só quando o PR for mergeado |
| Epic #1 e demais Sub-Issues | Abertas e não alteradas |
| Merge | Não realizado; depende de revisão aprovada e autorização formal |
| CI | Não há check runs configurados no repositório |

## 9. Próximas ações

1. ~~Marcar o PR #17 como "Ready for review" e mover a #11 para `Under review`~~ (feito).
2. A revisora `LayssaRD` revisa o PR no GitHub (comentários ou aprovação).
3. Tratar as observações da revisão, se houver.
4. Obter autorização formal da equipe antes do merge.
5. SUB-05 (#14): mapear `SameParticipantSchedulingException` (RN05).
6. Confirmar com `LayssaRD` a remoção da branch vazia `11-sub-02-definir-dto-de-entrada-e-endpoint-http-de-criação`.
