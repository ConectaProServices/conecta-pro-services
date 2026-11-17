# 08-04 - Execução HTTP Integrada

## 1. Ambiente

| Item | Valor |
| --- | --- |
| Branch | `feature/15-teste-integrado-backend` (código de produção idêntico à `main` `b3ac5be`) |
| Aplicação | `pnpm build` + `PORT=3000 node dist/main` |
| Ferramenta | `curl -i` (Git Bash, Windows 11) |
| Endpoint | `POST http://localhost:3000/schedulings` |
| Banco | PostgreSQL 17 (`conecta-postgres`, porta 5435), tabela `scheduling.schedulings` |
| Data | 17/11/2026, 18:05 UTC |

### Adaptação ao projeto

A aplicação em execução usa o provider de produção: `SCHEDULING_REPOSITORY → TypeOrmSchedulingRepository` (PostgreSQL). O `InMemorySchedulingRepository` foi criado só para o contexto de teste e **não** está ligado ao `main.ts`. Por isso:

- **Requisições manuais (este artefato):** Controller → Service → `TypeOrmSchedulingRepository` → PostgreSQL, todos reais. É um fluxo mais completo que o do Material 08, pois inclui o banco.
- **Fluxo com repositório em memória:** exercitado por requisições HTTP reais via Supertest no teste integrado (08-05). O Supertest sobe o servidor HTTP do Nest em processo e envia requisições reais.

## 2. Cenário válido

```bash
curl -s -i -X POST http://localhost:3000/schedulings \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"e522e862-3c43-419c-b345-297dbe05a35b","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"e3a39cc4-0df7-44b6-818d-a3788f23d1c5","startsAt":"2026-11-20T18:00:00.000Z"}'
```

```text
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"schedulingId":"5d10e574-905b-4aa4-b742-46d01dd84b3f","customerId":"e522e862-3c43-419c-b345-297dbe05a35b","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"e3a39cc4-0df7-44b6-818d-a3788f23d1c5","startsAt":"2026-11-20T18:00:00.000Z","endsAt":"2026-11-20T19:00:00.000Z","status":"PENDING","message":"Scheduling requested successfully."}
```

### Os 10 pontos do fluxo integrado

| # | Ponto | Situação | Evidência |
| --- | --- | --- | --- |
| 1 | Aplicação inicializada | Confirmado | `Nest application successfully started` (08-03) |
| 2 | Rota disponível | Confirmado | `Mapped {/schedulings, POST} route`; resposta recebida |
| 3 | `ValidationPipe` + DTO executados | Confirmado | `startsAt` convertido em `Date` (sem isso o Service lançaria `getTime is not a function`, visto no 07-04) |
| 4 | Controller real acionado | Confirmado | `SchedulingController.request` é a única rota de `POST /schedulings` |
| 5 | Service real executado | Confirmado | `endsAt` calculado (+60 min do catálogo) e `message` vêm do `SchedulingService` |
| 6 | Token do repositório resolvido | Confirmado | A aplicação compila só se `SCHEDULING_REPOSITORY` estiver resolvido (08-06) |
| 7 | Implementação do repositório acionada (`save`) | Confirmado | Registro presente no banco (seção 4) |
| 8 | Resposta `201 Created` | Confirmado | Status da resposta |
| 9 | Identificador gerado | Confirmado | `schedulingId: 5d10e574-905b-4aa4-b742-46d01dd84b3f` (gerado por `randomUUID()` no Service) |
| 10 | Dados de entrada preservados | Confirmado | `customerId`, `serviceId`, `professionalId`, `startsAt` iguais ao payload |

## 3. Cenário inválido

```bash
curl -s -i -X POST http://localhost:3000/schedulings \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"x","startsAt":"2026-13-45"}'
```

```text
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"message":["customerId should not be empty","customerId must be a UUID","professionalId must be a UUID","startsAt must be a Date instance"],"error":"Bad Request","statusCode":400}
```

Rejeição na fronteira HTTP pelo `ValidationPipe`, com mensagens dos decoradores do DTO.

**Ressalva:** este 400 comprova a validação da **fronteira**. Ele não comprova que o `SchedulingService` rejeitaria esses dados se chamado diretamente, sem o pipe (por exemplo, por outro adaptador de entrada). As regras de domínio (RN01, RN05, INV-1) têm testes próprios (Nível A e domínio).

## 4. Resposta HTTP vs. inspeção do armazenamento

| Evidência | O que comprova | O que não comprova |
| --- | --- | --- |
| **Resposta HTTP** 201 com `schedulingId` | A requisição atravessou o fluxo e o Service devolveu dados coerentes com o contrato | Que o dado foi efetivamente gravado. O corpo é montado a partir do retorno de `save`, que poderia ser só um eco |
| **Inspeção direta do PostgreSQL** | O registro existe na tabela com os valores esperados | Comportamento do adaptador em memória |

Consulta executada:

```text
$ docker exec conecta-postgres psql -U conecta_user -d conecta_db -c "SELECT \"schedulingId\", \"customerId\", \"professionalId\", \"startsAt\", \"endsAt\", status FROM scheduling.schedulings WHERE \"schedulingId\" = '5d10e574-905b-4aa4-b742-46d01dd84b3f';"

             schedulingId             |              customerId              |            professionalId            |        startsAt        |         endsAt         | status
--------------------------------------+--------------------------------------+--------------------------------------+------------------------+------------------------+---------
 5d10e574-905b-4aa4-b742-46d01dd84b3f | e522e862-3c43-419c-b345-297dbe05a35b | e3a39cc4-0df7-44b6-818d-a3788f23d1c5 | 2026-11-20 18:00:00+00 | 2026-11-20 19:00:00+00 | PENDING
(1 row)
```

A primeira tentativa de consulta usou nomes errados de tabela e coluna. O mapeamento real é `@Entity({ name: 'schedulings', schema: 'scheduling' })`, com colunas em camelCase. A consulta foi corrigida e reexecutada.

Para o adaptador em memória, a inspeção do armazenamento está em 08-05 §5.

## 5. Limitações e conclusões

- O fluxo HTTP real funciona de ponta a ponta com componentes reais, inclusive o banco.
- As requisições manuais deixaram um registro no Postgres local (`5d10e574-...`), que não foi removido.
- A verificação manual é pontual. A garantia repetível está no teste integrado (08-05).
- RN05 via HTTP continua sem mapeamento (500): pendência da SUB-05 (#14).
