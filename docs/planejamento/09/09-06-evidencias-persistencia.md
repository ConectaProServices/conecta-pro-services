# 09-06 - Evidências da Persistência Real e Durabilidade

## 1. Ambiente

| Item | Valor |
| --- | --- |
| Branch | `feature/13-persistencia-postgresql` (com `synchronize: false` e a entidade ajustada) |
| Backend | `pnpm build` + `PORT=3000 node dist/main` |
| Banco | `conecta_dev` (migração `CreateSchedulings1793060000000` aplicada), container `conecta-postgres`, `localhost:5435` |
| Cliente HTTP | `curl -i` (Git Bash, Windows 11) |
| Cliente SQL | `docker exec -i conecta-postgres psql -U conecta_user -d conecta_dev` |
| Data | 17/11/2026, 18:24 UTC |

## 2. Roteiro de durabilidade (7 passos), execução real

### Passo 1: backend iniciado e cadastro via HTTP

```text
=== [1] backend iniciado 18:24:35Z
LOG [InstanceLoader] SchedulingModule dependencies initialized
LOG [RouterExplorer] Mapped {/schedulings, POST} route
LOG [NestApplication] Nest application successfully started
```

```bash
curl -s -i -X POST http://localhost:3000/schedulings -H 'Content-Type: application/json' \
  -d '{"customerId":"56198f95-9b89-4f02-b1c2-320bb0fbc0c1","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"d0180555-2cb8-483f-a0bb-a43bc8ac664f","startsAt":"2026-11-21T18:00:00.000Z"}'
```

```text
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Date: Tue, 17 Nov 2026 18:24:36 GMT

{"schedulingId":"2d3724d1-4159-4d99-b7ff-461b10c48c84","customerId":"56198f95-9b89-4f02-b1c2-320bb0fbc0c1","serviceId":"33333333-3333-4333-8333-333333333333","professionalId":"d0180555-2cb8-483f-a0bb-a43bc8ac664f","startsAt":"2026-11-21T18:00:00.000Z","endsAt":"2026-11-21T19:00:00.000Z","status":"PENDING","message":"Scheduling requested successfully."}
```

### Passos 2 e 3: consulta SQL antes do reinício e UUID anotado

UUID: **`2d3724d1-4159-4d99-b7ff-461b10c48c84`**

```text
=== [3] SQL antes do reinicio 18:24:36Z
SELECT "schedulingId", "customerId", "professionalId", "startsAt", "endsAt", status, "createdAt" FROM scheduling.schedulings WHERE "schedulingId" = '2d3724d1-4159-4d99-b7ff-461b10c48c84';
             schedulingId             |              customerId              |            professionalId            |        startsAt        |         endsAt         | status  |         createdAt
--------------------------------------+--------------------------------------+--------------------------------------+------------------------+------------------------+---------+----------------------------
 2d3724d1-4159-4d99-b7ff-461b10c48c84 | 56198f95-9b89-4f02-b1c2-320bb0fbc0c1 | d0180555-2cb8-483f-a0bb-a43bc8ac664f | 2026-11-21 18:00:00+00 | 2026-11-21 19:00:00+00 | PENDING | 2026-11-17 18:24:36.621+00
(1 row)
```

### Passo 4: encerramento somente do backend

```text
=== [4] encerrando somente o backend
backend PID 3392 encerrado
porta 3000 apos encerrar: HTTP 000
postgres: Up About an hour (healthy)
```

O processo Node (PID 3392) foi encerrado e a porta 3000 parou de responder (`HTTP 000`, sem conexão). O container do PostgreSQL continuou ativo e saudável; o volume não foi tocado.

### Passo 5: reinicialização do backend

```text
=== [5] reiniciando backend 18:24:42Z
PID 16124 LOG [NestApplication] Nest application successfully started
```

Novo processo, PID 16124, diferente do 3392. Não há estado em memória herdado.

### Passo 6: consulta SQL depois do reinício

```text
=== [6] SQL depois do reinicio 18:24:43Z
             schedulingId             |              customerId              |            professionalId            |        startsAt        |         endsAt         | status  |         createdAt
--------------------------------------+--------------------------------------+--------------------------------------+------------------------+------------------------+---------+----------------------------
 2d3724d1-4159-4d99-b7ff-461b10c48c84 | 56198f95-9b89-4f02-b1c2-320bb0fbc0c1 | d0180555-2cb8-483f-a0bb-a43bc8ac664f | 2026-11-21 18:00:00+00 | 2026-11-21 19:00:00+00 | PENDING | 2026-11-17 18:24:36.621+00
(1 row)
```

### Passo 7: comparação

```text
=== [7] comparacao
$ diff row-before.txt row-after.txt
IDENTICOS
```

As duas saídas SQL são byte a byte iguais.

## 3. Conclusões

| Verificação | Resultado |
| --- | --- |
| Cadastro HTTP persistiu no PostgreSQL | Sim: o registro existe em `scheduling.schedulings` com o UUID retornado |
| Atributos persistidos correspondem à resposta | Sim: `customerId`, `professionalId`, `startsAt`, `endsAt` (+60 min do catálogo) e `PENDING` |
| `createdAt` preenchido | Sim (`2026-11-17 18:24:36.621+00`) |
| Durabilidade após reinício do backend | **Comprovada**: registro idêntico antes e depois, com outro processo (PID 3392 → 16124) |
| Endpoint `GET` criado para verificar? | Não: verificação feita só por SQL direto |

O registro `2d3724d1-...` permanece em `conecta_dev` como evidência (não foi apagado).
