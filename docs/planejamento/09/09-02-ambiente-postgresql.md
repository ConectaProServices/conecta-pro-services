# 09-02 - Ambiente PostgreSQL

## 1. Infraestrutura inspecionada

### `compose.yaml` (versionado)

```yaml
services:
  postgres:
    image: postgres:17
    container_name: conecta-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: conecta_user
      POSTGRES_PASSWORD: <senha de desenvolvimento versionada no compose>
      POSTGRES_DB: conecta_db
    ports:
      - "5432:5432"
    volumes:
      - conecta_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U conecta_user -d conecta_db"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  conecta_postgres_data:
```

### Containers em execução (`docker ps -a`)

| Container | Imagem | Porta host → container | Projeto compose |
| --- | --- | --- | --- |
| `conecta-postgres` | `postgres:17` | **5435 → 5432** | `conecta-pro-services-backend` (este projeto) |
| `celilac-postgres` | `postgres:17` | 5434 → 5432 | `celilac-backend` (outro projeto, **não tocado**) |
| `rentpro-postgres` | `postgres:17` | 5433 → 5432 | `rentpro-backend` (outro projeto, **não tocado**) |

Volumes: `conecta-pro-services-backend_conecta_postgres_data` (em uso), `conecta_postgres_data` (órfão, não tocado), além dos volumes dos outros projetos.

**Divergência:** o container publica **5435**, mas o `compose.yaml` versionado declara **5432**. O container foi criado com uma configuração local diferente da versionada. Um `docker compose up` com o arquivo atual tentaria recriar o container na porta 5432. Por isso **nenhum comando `docker compose` foi executado** nesta etapa.

## 2. Decisão: sem novo serviço Docker

Por decisão da equipe, o serviço existente atende os dois ambientes. O isolamento é feito **por banco e por usuário** dentro do mesmo PostgreSQL 17:

| Ambiente | Banco | Usuário | Privilégios |
| --- | --- | --- | --- |
| Legado (intacto) | `conecta_db` | `conecta_user` | Tabela criada pelo `synchronize`; 2 registros; **não alterado nem apagado** |
| Desenvolvimento | `conecta_dev` (novo) | `conecta_user` | Receberá a migration (09-04) |
| Testes | `conecta_test` (novo) | `conecta_test_user` (novo) | `LOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`; dono só de `conecta_test` |

## 3. Comandos executados (17/11/2026)

### 3.1 Verificação prévia: nada a sobrescrever

```text
$ docker exec -i conecta-postgres psql -U conecta_user -d postgres -t -c "SELECT 'db:'||datname FROM pg_database WHERE datname IN ('conecta_dev','conecta_test') UNION ALL SELECT 'role:'||rolname FROM pg_roles WHERE rolname='conecta_test_user';"
(nenhuma linha)

$ ... -c "SELECT rolname, rolsuper FROM pg_roles WHERE rolname='conecta_user';"
 conecta_user | t

$ ... -c "SELECT name, default_version FROM pg_available_extensions WHERE name='btree_gist';"
 btree_gist | 1.7
```

### 3.2 Criação (somente objetos novos)

Senha do usuário de teste gerada localmente (`secrets.token_urlsafe(18)`) e passada ao `psql` por variável (`-v tp=...`), sem aparecer no comando nem neste documento.

```sql
CREATE DATABASE conecta_dev OWNER conecta_user;
CREATE ROLE conecta_test_user LOGIN PASSWORD :'tp' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE conecta_test OWNER conecta_test_user;
REVOKE CONNECT ON DATABASE conecta_test FROM PUBLIC;
REVOKE CONNECT ON DATABASE conecta_dev  FROM PUBLIC;
REVOKE CONNECT ON DATABASE conecta_db   FROM PUBLIC;
```

```text
CREATE DATABASE
CREATE ROLE
CREATE DATABASE
REVOKE
REVOKE
REVOKE
```

Os `REVOKE CONNECT ... FROM PUBLIC` impedem que qualquer usuário não autorizado, inclusive o de testes, abra conexão nos bancos de dev e legado. O `conecta_user` (superusuário) e o dono de cada banco mantêm acesso.

### 3.3 Variáveis de ambiente (`.env` local, não versionado)

O `.env` existente foi **preservado**; as variáveis de teste foram **acrescentadas** ao final:

```dotenv
DB_HOST=localhost
DB_PORT=5435
DB_USERNAME=conecta_user
DB_PASSWORD=***
DB_NAME=conecta_db          # passará a conecta_dev após synchronize:false + migration (09-03/09-04)

# Banco exclusivo de testes de integração (Material 09)
TEST_DB_HOST=localhost
TEST_DB_PORT=5435
TEST_DB_USERNAME=conecta_test_user
TEST_DB_PASSWORD=***
TEST_DB_NAME=conecta_test
TEST_DB_ALLOW_DESTRUCTIVE=false
```

`git check-ignore .env` confirma que o arquivo é ignorado (`.gitignore` linha 42).

O `DB_NAME` **ainda não** foi trocado para `conecta_dev`. Com `synchronize: true` ativo no `AppModule`, qualquer execução da aplicação ou do E2E criaria a tabela em `conecta_dev` pelo `synchronize`, repetindo o problema de `conecta_db`. A troca ocorre depois de desativar o `synchronize` e aplicar a migration.

## 4. Verificação de conexão a partir do host

Script `node` executado no diretório do backend, com o `pg` do projeto e as variáveis do `.env`:

```text
dev user  -> conecta_dev           OK   db=conecta_dev user=conecta_user client_port=5435 inet_server_port=5432 | PostgreSQL 17.10 (Debian 17.10-1.pgdg13+1)
test user -> conecta_test          OK   db=conecta_test user=conecta_test_user client_port=5435 inet_server_port=5432 | PostgreSQL 17.10 (Debian 17.10-1.pgdg13+1)
test user -> conecta_dev (deve falhar) FAIL 42501 permission denied for database "conecta_dev"
test user -> conecta_db  (deve falhar) FAIL 42501 permission denied for database "conecta_db"
```

## 5. Porta do host vs. porta do container

No mapeamento `0.0.0.0:5435->5432/tcp`:

- **5435** é a porta publicada no host. É a que o Node, o TypeORM e os testes usam (`localhost:5435`).
- **5432** é a porta em que o processo PostgreSQL escuta dentro do container.

A saída acima mostra exatamente isso: o cliente conectou em **5435**, e `inet_server_port()` retornou **5432**. Por isso o teste automatizado (09-07) valida `current_database()` e `current_user`, mas **não** exige que `inet_server_port()` seja igual à porta do host.

## 6. Salvaguardas aplicadas

- Nenhum `docker compose up/down`, nenhuma remoção de volume ou container.
- Containers e volumes de outros projetos não foram tocados.
- `conecta_db` não foi alterado (nenhum `DROP` ou `TRUNCATE`).
- Credenciais de teste distintas das de desenvolvimento, usuário sem privilégios administrativos, isolamento por `REVOKE CONNECT`.
- Nenhuma senha real neste artefato.

## 7. Pendências

- Divergência `compose.yaml` (5432) × container (5435): proposta de parametrizar a porta (`"${DB_PORT:-5432}:5432"`) para que o compose reflita o `.env` sem quebrar quem usa 5432. Depende de decisão da equipe.
- A senha de desenvolvimento está versionada em texto no `compose.yaml` (preexistente). Sugestão: movê-la para variável de ambiente.
- `.env.example`: acrescentar as chaves `TEST_DB_*` (sem valores) junto com as alterações de código.
