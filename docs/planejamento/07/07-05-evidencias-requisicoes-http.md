# 07-05 - Evidências das Requisições HTTP

## 1. Ambiente

| Item | Valor |
| --- | --- |
| Sistema | Windows 11 Pro, Git Bash |
| Aplicação | `pnpm build` + `PORT=3000 node dist/main` (branch `feature/11-endpoint-http-solicitar-agendamento`, alterações não commitadas no momento do teste) |
| Banco | PostgreSQL 17, container `conecta-postgres`, `localhost:5435` |
| Ferramenta HTTP | `curl` (`-i` para exibir status e cabeçalhos) |
| Endpoint | `POST http://localhost:3000/schedulings` |
| Data | 17/11/2026, 17:20 UTC |

Os cabeçalhos `X-Powered-By`, `ETag`, `Connection`, `Keep-Alive` e `Content-Length` foram omitidos das saídas abaixo.

## 2. Cenário 1 - Payload válido

```bash
curl -s -i -X POST http://localhost:3000/schedulings \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"1b3e2802-765f-4a48-88c7-5e766642e3b3","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"732a05a2-2000-42c5-ab81-4cc36c881ce9","startsAt":"2026-11-19T17:20:49.000Z"}'
```

`startsAt` foi gerado como "agora + 48h" para respeitar RN01; os UUIDs foram gerados aleatoriamente.

```text
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"schedulingId":"e86d8cfa-f225-4f3d-b94c-790ebaf8e661","customerId":"1b3e2802-765f-4a48-88c7-5e766642e3b3","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"732a05a2-2000-42c5-ab81-4cc36c881ce9","startsAt":"2026-11-19T17:20:49.000Z","endsAt":"2026-11-19T18:20:49.000Z","status":"PENDING","message":"Scheduling requested successfully."}
```

Análise: `201`, `schedulingId` gerado pelo serviço, `endsAt` = `startsAt` + 60 min (duração do serviço demo), `status: PENDING`. Os nomes dos atributos seguem o contrato do serviço (`schedulingId`, não `id`).

## 3. Cenário 2 - Payload inválido

```bash
curl -s -i -X POST http://localhost:3000/schedulings \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"abc","serviceId":"","professionalId":"22222222-2222-4222-8222-222222222222","startsAt":"nao-e-data"}'
```

```text
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"message":["customerId must be a UUID","serviceId should not be empty","serviceId must be a UUID","startsAt must be a Date instance"],"error":"Bad Request","statusCode":400}
```

| Mensagem | Decorador de origem |
| --- | --- |
| `customerId must be a UUID` | `@IsUUID()` em `customerId` |
| `serviceId should not be empty` | `@IsNotEmpty()` em `serviceId` |
| `serviceId must be a UUID` | `@IsUUID()` em `serviceId` |
| `startsAt must be a Date instance` | `@Type(() => Date)` + `@IsDate()` em `startsAt` |

A requisição foi rejeitada pelo `ValidationPipe` antes do Controller. No log da aplicação não aparece erro do serviço nessa requisição. A garantia formal de que o serviço não é chamado está no teste 2 de 07-06 (`not.toHaveBeenCalled()`).

## 4. Cenário complementar - Regra de domínio (RN01)

Payload com formato válido, mas `startsAt` = agora + 2h:

```text
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json; charset=utf-8

{"statusCode":422,"error":"SchedulingTooSoonException","message":"Scheduling requires at least 24 hours of notice."}
```

Confirma que o ajuste do filtro **não quebrou** o mapeamento das exceções de domínio. Também ilustra a diferença entre camadas: o 400 vem da fronteira HTTP, o 422 vem do agregado (RN01).

## 5. Esperado vs. observado

| Cenário | Antes (`main`, sem pipe/filtro global) | Esperado | Observado após a alteração |
| --- | --- | --- | --- |
| Válido | 500 (`startsAt.getTime is not a function`) | 201 + corpo do agendamento | **201**, corpo conforme contrato |
| Inválido | 500 (erro do catálogo, não tratado) | 400 + mensagens do DTO | **400**, 4 mensagens do DTO |
| RN01 | — (não executado antes) | 422 | **422** `SchedulingTooSoonException` |

## 6. Limites desta verificação

- É uma verificação manual e pontual, sem garantia de regressão. A garantia automatizada está em 07-06.
- O cenário válido gravou um registro real no Postgres local (`schedulingId e86d8cfa-...`), que não foi removido.
- O 400 comprova a validação da **fronteira HTTP**. Ele não testa regras de negócio do serviço.
- RN05 (cliente = prestador) não foi exercitada via HTTP: resultaria em 500 até a SUB-05 mapear a exceção.
