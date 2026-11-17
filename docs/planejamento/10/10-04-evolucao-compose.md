# 10-04 - Evolução do Compose

## 1. Serviços antes e depois

| Serviço | Antes | Depois |
| --- | --- | --- |
| `postgres` (`conecta-postgres`) | Existente; porta `"5432:5432"` | **Preservado**; só a porta publicada passou a `"5435:5432"` |
| `api` (`conecta-api`) | Inexistente | **Adicionado** |
| Banco de testes | `conecta_test` dentro do mesmo PostgreSQL (Material 09, sem serviço separado) | Preservado (sem mudança) |

## 2. Diff aplicado (`conecta-pro-services-backend/compose.yaml`)

```diff
     ports:
-      - "5432:5432"
+      # host 5435 -> porta interna 5432 do PostgreSQL (a 5432 do host costuma estar ocupada)
+      - "5435:5432"
     volumes:
       - conecta_postgres_data:/var/lib/postgresql/data
     healthcheck:
@@
       retries: 10

+  api:
+    container_name: conecta-api
+    restart: unless-stopped
+    build:
+      context: .
+      dockerfile: Dockerfile
+    image: conecta-pro-services-api:dev
+    ports:
+      - "${PORT:-3000}:3000"
+    environment:
+      PORT: 3000
+      # Dentro da rede do Compose o banco é alcançado pelo nome do serviço e pela porta interna.
+      DB_HOST: postgres
+      DB_PORT: 5432
+      DB_USERNAME: ${DB_USERNAME}
+      DB_PASSWORD: ${DB_PASSWORD}
+      DB_NAME: ${DB_NAME}
+    depends_on:
+      postgres:
+        condition: service_healthy
+
 volumes:
   conecta_postgres_data:
```

O restante do arquivo (imagem, `container_name`, `environment` do Postgres, volume, healthcheck) foi mantido sem alteração.

## 3. Porta do PostgreSQL: decisão e prova de não recriação

- A porta 5432 do host está ocupada por outro processo (PID 6232, fora do Docker). O container real já publicava `5435:5432`.
- Decisão da equipe: fixar `"5435:5432"` no arquivo versionado. Observação: a opção apresentada na pergunta foi escrita como "5435:5435"; o mapeamento correto, com o PostgreSQL escutando em 5432 dentro do container, é `5435:5432`.

Hash de configuração do serviço (comparado antes de alterar o arquivo) [Exec]:

```text
container conecta-postgres:  6310e60dc604f3d8706b7b60bf9de2aa6cf57e959cebc77f70057568755f7cc8
compose antigo (5432:5432):  3f0d2c3b0557fd0bfcd329adc78d2cd27cd0ccb45b64e2e60aa826e87fe90bff
compose novo  (5435:5432):   6310e60dc604f3d8706b7b60bf9de2aa6cf57e959cebc77f70057568755f7cc8
```

Depois do `docker compose up -d --build api`: `Container conecta-postgres  Running` (não recriado); mesmo ID `683617b089b1` e `created=2026-11-03T17:42:46Z` antes e depois.

## 4. Verificações

| # | Item | Resultado |
| --- | --- | --- |
| 1 | Serviço da API | `api` / `conecta-api` |
| 2 | `build` | `context: .`, `dockerfile: Dockerfile`; imagem `conecta-pro-services-api:dev` |
| 3 | Porta e nome | `${PORT:-3000}:3000` → `0.0.0.0:3000->3000/tcp` |
| 4 | Variáveis | `PORT`, `DB_HOST=postgres`, `DB_PORT=5432` fixos; credenciais e `DB_NAME` interpolados do `.env` |
| 5 | `depends_on` | `postgres: condition: service_healthy`; healthcheck `pg_isready` existente. Log: `Container conecta-postgres  Waiting` → `Healthy` → `conecta-api Starting` |
| 6 | Volumes | `conecta_postgres_data` preservado (`docker compose config --volumes` → `conecta_postgres_data`); banco de testes no mesmo volume, intacto |
| 7 | Rede | Rede padrão `conecta-pro-services-backend_default` compartilhada (10-05) |
| 8 | Bancos | Nenhuma alteração de schema ou dados por este passo |

## 5. Credenciais

O `${DB_USERNAME}`/`${DB_PASSWORD}` interpolados do `.env` correspondem ao usuário do volume já inicializado: a API autenticou (conexão `conecta_user` vinda de `172.20.0.3` em `pg_stat_activity`, 10-05). Nenhuma credencial do banco foi alterada (mudar o `environment` do Postgres não alteraria as credenciais gravadas no volume).

## 6. Validação [Exec]

```text
$ docker compose config --quiet && echo OK
OK
$ docker compose config --services
postgres
api
```

Usado só `--quiet`. As variáveis efetivas foram listadas por script com a senha mascarada (10-05).

## 7. `COMPOSE_PROJECT_NAME`

- Valor: `conecta-pro-services-backend`, **igual ao nome atual** do projeto (label `com.docker.compose.project` do container). Assim, rede e volume continuam os mesmos (`conecta-pro-services-backend_default`, `conecta-pro-services-backend_conecta_postgres_data`).
- `.env` local: acrescentado ao final. `.env.example`: acrescentado com o mesmo valor (não sensível) e `PORT=` vazio.

## 8. Pendências

- `POSTGRES_PASSWORD` de desenvolvimento segue em texto no `compose.yaml` (preexistente). Sugestão: `${POSTGRES_PASSWORD}` a partir do `.env`, ao migrar todos os colegas.
- Volume órfão `conecta_postgres_data` (sem prefixo) existe no Docker local; não usado e não tocado.
