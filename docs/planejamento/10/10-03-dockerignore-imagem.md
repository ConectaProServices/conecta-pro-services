# 10-03 - .dockerignore e Imagem

## 1. `.dockerignore` (inexistente → criado) [Exec]

`conecta-pro-services-backend/.dockerignore`:

```text
# Dependências e artefatos gerados (reinstalados/compilados dentro da imagem)
node_modules
dist
coverage
*.tsbuildinfo

# Segredos e configuração local (as variáveis chegam pelo Compose)
.env
.env.*
!.env.example

# Controle de versão, editores e logs
.git
.gitignore
.vscode
.idea
*.log

# Não necessários para construir ou executar a API
test
http-rest-client
package-lock.json
compose.yaml
Dockerfile
.dockerignore
README.md
.oxlintrc.json
.prettierrc
vitest.config*.ts
```

### Contexto de build

| Necessário ao build | Excluído |
| --- | --- |
| `package.json`, `pnpm-lock.yaml`, `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, `src/` | `node_modules`, `dist`, `.env*`, testes, lockfile do npm, arquivos de Compose/Docker, configs de lint e testes |

O contexto enviado ao daemon caiu para **201.54 kB** (`transferring context: 201.54kB`), sem `node_modules` nem `.env`. Além disso, o Dockerfile usa `COPY` seletivo e não `COPY . .`, então nenhum arquivo não listado entra na imagem mesmo que o `.dockerignore` falhe.

## 2. Construção [Exec]

Primeira construção (antes da correção do pnpm):

```text
$ docker build --progress=plain -t conecta-pro-services-api:dev .
#4 [build 1/8] FROM docker.io/library/node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
#7 [build 3/8] RUN npm install -g pnpm@12.8.1             DONE 8.7s
#12 [build 5/8] RUN pnpm install --frozen-lockfile        Packages: +386 / Done in 12.7s using pnpm v12.8.1
#15 [build 8/8] RUN pnpm build                            DONE 2.2s
#10 [runtime 5/6] RUN pnpm install --prod --frozen-lockfile   Packages: +169 / Done in 10.6s using pnpm v12.8.1
#16 [runtime 6/6] COPY --from=build /app/dist ./dist
#17 writing image sha256:b4dab0a38ae8e85db57befd63b953a9f5e6c16f465c9374a6b26a6d7bb2ab0aa done
#17 naming to docker.io/library/conecta-pro-services-api:dev done
exit=0
```

Reconstrução após a correção do pnpm (10-02 §5):

```text
$ docker compose build api
#17 writing image sha256:8310cabbef9cb5ee11f1a14e3accb63042d607008aaf67f106dd90245cd9c09f done
#17 naming to docker.io/library/conecta-pro-services-api:dev 0.0s done
build exit=0
```

## 3. Identificação da imagem [Exec]

```text
$ docker image ls conecta-pro-services-api
conecta-pro-services-api:dev id=8310cabbef9c size=474MB

$ docker image inspect conecta-pro-services-api:dev
user=node workdir=/app cmd=["node","dist/main.js"] expose={"3000/tcp":{}}
env=[..., "NODE_VERSION=24.21.0", "NODE_ENV=production", "PORT=3000", ...]
```

### Conteúdo verificado (`docker run --rm --entrypoint sh ...`, primeira imagem)

```text
--- /app
dist
node_modules
package.json
pnpm-lock.yaml
--- dist (js principais)
dist/database/data-source.js
dist/database/migrations/1793060000000-CreateScheduling.js
dist/main.js
--- arquivos .env na imagem:
(fim)                                   <- nenhum
--- src/test na imagem:
ls: cannot access '/app/src': No such file or directory
ls: cannot access '/app/test': No such file or directory
--- dev deps ausentes?
ls: cannot access 'node_modules/@nestjs/cli': No such file or directory
ls: cannot access 'node_modules/vitest': No such file or directory
--- typeorm bin:
node_modules/.bin/typeorm
v24.21.0
12.8.1
uid=1000(node) gid=1000(node) groups=1000(node)
```

## 4. Análise

| Critério | Resultado |
| --- | --- |
| Build concluído | Sim (exit 0, duas vezes) |
| Dependências instaladas | 386 (build) / 169 (runtime, só produção) |
| Compilação | Sim (`nest build`) |
| Arquivos obrigatórios | `dist/main.js`, DataSource e migration compilados presentes |
| Tag | `conecta-pro-services-api:dev` |
| Segredos | Nenhum `.env` na imagem; nenhuma variável de credencial no `Config.Env` |
| Erros impeditivos | Nenhum no build. A falha do pnpm apareceu só na execução de scripts e foi corrigida |

> Imagem construída ≠ aplicação funcional. O funcionamento foi comprovado depois, pelos logs, por HTTP e por SQL (10-06, 10-07).
