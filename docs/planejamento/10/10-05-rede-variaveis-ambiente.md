# 10-05 - Rede e Variáveis de Ambiente

## 1. Host vs. Compose

| Onde o backend roda | `DB_HOST` | `DB_PORT` | Origem |
| --- | --- | --- | --- |
| No host (`pnpm start`, testes, CLI) | `localhost` | `5435` (porta **publicada**) | `.env` |
| No Compose (`conecta-api`) | `postgres` (nome do serviço) | `5432` (porta **interna**) | `environment` do serviço `api` |

**Por que não `localhost` dentro do contêiner:** cada contêiner tem a própria interface de rede. Dentro do `conecta-api`, `localhost` é o próprio contêiner da API, onde não há PostgreSQL. A evidência abaixo mostra `localhost -> ::1` e `postgres -> 172.20.0.2`.

## 2. Variáveis

| Mecanismo | Uso neste projeto |
| --- | --- |
| `.env` (host) | Lido pelo Compose para **interpolação** (`${DB_USERNAME}`, `${DB_PASSWORD}`, `${DB_NAME}`, `${PORT}`, `COMPOSE_PROJECT_NAME`) e pela aplicação/CLI no host via `dotenv`/`ConfigModule` |
| `environment` (serviço `api`) | Define as variáveis **dentro** do contêiner; `DB_HOST`/`DB_PORT` fixos **sobrescrevem** os valores de host do `.env` |
| `env_file` | Não usado, para não injetar `TEST_DB_*` nem `DB_HOST=localhost` no contêiner |
| `.env.example` | Chaves sem valores sensíveis, incluindo `COMPOSE_PROJECT_NAME` e `PORT` |

O `.env` não entra na imagem (`.dockerignore`); o `ConfigModule.forRoot({ envFilePath: '.env' })` encontra o arquivo ausente e usa `process.env`.

## 3. Verificação prática [Exec]

```text
$ docker inspect conecta-api (redes)
rede da api: conecta-pro-services-backend_default
$ docker network inspect conecta-pro-services-backend_default
conecta-api 172.20.0.3/16
conecta-postgres 172.20.0.2/16

$ docker compose exec -T api node -e "dns.lookup('localhost'); dns.lookup('postgres')"
postgres  -> 172.20.0.2
localhost -> ::1

$ docker compose exec -T api node -e "<imprime variáveis sem senha>"
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=conecta_user
DB_NAME=conecta_dev
DB_PASSWORD definido: true
TEST_DB_* presentes: 0
```

Conexão observada pelo PostgreSQL, logo após o `POST /schedulings`:

```text
$ docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d conecta_dev' <<< "SELECT datname, usename, client_addr, state FROM pg_stat_activity WHERE datname = 'conecta_dev' AND pid <> pg_backend_pid();"
   datname   |   usename    | client_addr | state
-------------+--------------+-------------+-------
 conecta_dev | conecta_user | 172.20.0.3  | idle
(1 row)
```

Uma consulta anterior, alguns segundos após a inicialização, retornou 0 linhas: o pool do `pg` encerra conexões ociosas. Depois da requisição, a conexão do IP da API (`172.20.0.3`) aparece.

| Verificação | Resultado |
| --- | --- |
| Mesma rede | Sim (`conecta-pro-services-backend_default`) |
| Nome do serviço resolvido | `postgres` → `172.20.0.2` |
| Porta interna | 5432 |
| Variáveis no processo | Sim |
| Credenciais | Conexão autenticada como `conecta_user` |
| Banco usado | `conecta_dev` (≠ `conecta_test`) |

`curl`, `psql` e `ping` não foram assumidos dentro da imagem runtime: as verificações usaram `node -e` no contêiner da API e `psql` no contêiner do PostgreSQL.

## 4. Banco de testes

- Continua sendo `conecta_test` com o usuário `conecta_test_user`, no mesmo servidor, acessível do host em `localhost:5435`.
- A API **não** recebe `TEST_DB_*` (contagem 0) e aponta para `conecta_dev`.
- O `conecta_test_user` não tem `CONNECT` em `conecta_dev` (Material 09).

## 5. Pendências

Nenhuma de rede. As senhas ficam só no `.env` local; nenhum valor aparece neste documento.
