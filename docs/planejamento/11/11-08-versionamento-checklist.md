# 11-08 - Versionamento e Checklist Consolidado

## 1. Projeto

Conecta Pro Services, backend NestJS.

## 2. Caso de uso

UC01 - Solicitar Agendamento, `POST /schedulings`.

## 3. Issue

Issue associada pela maior cobertura: **#15 - `[SUB-06] Definir testes automatizados do UC01`**. A Issue #20 não foi reutilizada, pois é específica da containerização.

## 4. Branch

`feature/material-11-http-contract-stabilization`, criada a partir de `main`.

## 5. Estado inicial

DTO de resposta existente sem uso no Controller; resposta montada pelo Service; teste HTTP fechado de sucesso sem cenário de propriedade interna adicional.

## 6. Contrato público

Confirmado: `schedulingId`, `customerId`, `serviceId`, `professionalId`, `startsAt`, `endsAt`, `status`, `message`.

## 7. DTO de entrada

Preservado integralmente em `RequestSchedulingDto`.

## 8. DTO de resposta

Preservado e completado em `RequestSchedulingResponseDto`.

## 9. Mapper

Criado `toRequestSchedulingResponse` em `src/modules/scheduling/mappers/scheduling-response.mapper.ts`.

## 10. Controller

Continua chamando `SchedulingService.requestScheduling(dto)` e agora aplica o mapper no retorno.

## 11. Semântica HTTP

`201 Created` preservado. `400`, `404`, `409` e `422` preservados ou cobertos por testes. Nenhuma nova regra foi criada.

## 12. Testes de contrato

Novo teste fechado de não exposição: aprovado após ciclo RED → GREEN.

## 13. Compatibilidade

Matriz criada; nenhuma breaking change foi implementada.

## 14. API containerizada

Verificada em 19/11/2026. A imagem foi reconstruída com Docker Compose; `conecta-api` ficou `Up` e `conecta-postgres` ficou `healthy`. Sucesso `201`, vazio e tipos inválidos `400`, campo extra ignorado e RN05 `500` foram observados.

## 15. Regressão

`pnpm test`: 22/22 aprovado. `pnpm test:integration`: 5/5 aprovados em `conecta_test`, incluindo validação da identidade do banco/usuário e migrations. `pnpm build`: aprovado. `pnpm lint`: aprovado com 1 warning preexistente.

## 16. Alterações realizadas

- Mapper HTTP criado.
- DTO de resposta completado.
- Controller atualizado.
- Teste de não exposição acrescentado.
- Oito artefatos Markdown adicionados.

Nenhuma alteração em Service, Repository, entidade de domínio, entidade ORM, Docker ou banco.

## 17. Commits

**a827522** - `feat(scheduling): stabilize HTTP response contract (refs #15)`.<br>
**39ec40c** - `docs(material-11): register issue #15 traceability (refs #15)`.

## 18. Pull Request

**#22** — [feat(scheduling): stabilize HTTP response contract](https://github.com/ConectaProServices/conecta-pro-services/pull/22), aberto contra `main`, sem merge.

## 19. GitHub Project

Não atualizado por falta de acesso à CLI GitHub.

## 20. Checklist

| Área | Situação |
| --- | --- |
| Oito documentos do Material 10 analisados | Confirmado |
| Contrato anterior recuperado | Confirmado |
| Controller, DTO e Service inspecionados | Confirmado |
| Issue mais adequada associada | Confirmado (#15) |
| Campos públicos definidos | Confirmado |
| DTO de entrada diferenciado | Confirmado |
| Entidade ORM separada | Confirmado |
| DTO/mapper implementados | Confirmado |
| Controller preservado | Confirmado |
| Compilação concluída | Confirmado |
| Não exposição comprovada por teste | Confirmado |
| Semântica HTTP analisada | Confirmado |
| Testes anteriores preservados | Confirmado |
| Compatibilidade analisada | Confirmado |
| API containerizada reconstruída | Confirmado |
| Requisição real no contêiner | Confirmado |
| Regressão PostgreSQL | Confirmado (5/5) |
| Alterações inspecionadas | Confirmado |
| Segredos não versionados | Confirmado; `.env` não foi alterado |
| Nenhum merge automático | Confirmado |

## 21. Pendências

1. Acompanhar a revisão do PR #22.
2. Corrigir futuramente o mapeamento HTTP da exceção RN05, conforme decisão da Issue responsável.

## 22. Próximas ações

- Manter as evidências de teste e contêiner atualizadas na revisão do PR.
- Não fazer merge até revisão e aprovação conforme o fluxo do projeto.
