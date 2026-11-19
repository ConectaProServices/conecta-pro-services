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

`pnpm test`: 22/22 aprovado. `pnpm build`: aprovado. `pnpm lint`: aprovado com warning preexistente. `pnpm test:integration`: não executado por ausência de `TEST_DB_*`; 5 testes ignorados.

## 16. Alterações realizadas

- Mapper HTTP criado.
- DTO de resposta completado.
- Controller atualizado.
- Teste de não exposição acrescentado.
- Oito artefatos Markdown adicionados.

Nenhuma alteração em Service, Repository, entidade de domínio, entidade ORM, Docker ou banco.

## 17. Commits

**a827522** - `feat(scheduling): stabilize HTTP response contract (refs #15)`.

## 18. Pull Request

Não criado. Não há CLI GitHub disponível nesta sessão e não há Issue confirmada.

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
| Regressão PostgreSQL | Pendente |
| Alterações inspecionadas | Confirmado |
| Segredos não versionados | Confirmado; `.env` não foi alterado |
| Nenhum merge automático | Confirmado |

## 21. Pendências

1. Disponibilizar Docker Desktop/daemon.
2. Configurar `TEST_DB_*` em banco isolado.
3. Executar `pnpm test:integration`.
4. Reconstruir a imagem e testar `POST /schedulings`.
5. Criar/atualizar PR sem merge.

## 22. Próximas ações

- Executar o ambiente Docker.
- Repetir os cenários HTTP no contêiner.
- Consultar o registro no PostgreSQL em modo somente leitura.
- Atualizar os artefatos 11-05 e 11-07 com evidências reais.
- Versionar os resultados e registrar o PR no fluxo real do GitHub.
