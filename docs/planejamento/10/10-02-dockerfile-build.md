# 10-02 - Dockerfile e Build

## 1. Situação

O `Dockerfile` **não existia** [Exec]. Foi **criado** nesta atividade em `conecta-pro-services-backend/Dockerfile`, no formato multi-stage mínimo do Material 10, adaptado ao projeto real.

## 2. Dockerfile criado (versão final)

```dockerfile
# Backend NestJS (UC01) — imagem multi-stage.
# Versões alinhadas ao ambiente que gerou o pnpm-lock.yaml (Node 24.21.0, pnpm 12.8.1).
ARG NODE_VERSION=24.21.0
ARG PNPM_VERSION=12.8.1

# ---------- build: instala todas as dependências e compila o TypeScript ----------
FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
WORKDIR /app
RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

# ---------- runtime: só dependências de produção + código compilado ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG PNPM_VERSION
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# O pnpm 12 verifica/reinstala dependências antes de "pnpm <script>". Como a imagem roda como "node"
# e o node_modules (só produção) pertence ao root, isso falhava com ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR
# ao executar, por exemplo, "pnpm migration:show:prod". As dependências já foram instaladas no build.
ENV pnpm_config_verify_deps_before_run=false
ENV pnpm_config_update_notifier=false
RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# dist/ inclui main.js, database/data-source.js e database/migrations/*.js
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## 3. Auditoria (os 10 pontos)

| # | Ponto | Resultado | Evidência |
| --- | --- | --- | --- |
| 1 | Imagem Node | `node:24.21.0-bookworm-slim`, igual ao host (`node -v` → v24.21.0) | `node -v` na imagem → `v24.21.0` [Exec] |
| 2 | pnpm | `12.8.1`, igual ao host. Sem `packageManager` no `package.json`; versão fixada por `ARG` para não reescrever o lockfile | `pnpm -v` na imagem → `12.8.1`; log `Done in 12.7s using pnpm v12.8.1` [Exec] |
| 3 | Multi-stage | Estágios `build` e `runtime` | Log `[build 1/8]` ... `[runtime 6/6]` |
| 4 | `--frozen-lockfile` | Nos dois estágios; o lockfile foi aceito sem alteração | `Packages: +386` (build) / `+169` (runtime) |
| 5 | Compilação | `pnpm build` (`nest build`) no estágio de build | `[build 8/8] RUN pnpm build` → `DONE 2.2s` |
| 6 | Dependências de runtime | `pnpm install --prod`; o binário `typeorm` está presente para as migrations | `ls node_modules/.bin/typeorm` [Exec] |
| 7 | DataSource e migrations compilados | Presentes em `dist/` | `dist/database/data-source.js`, `dist/database/migrations/1793060000000-CreateScheduling.js` |
| 8 | Entry point | `CMD ["node", "dist/main.js"]`; caminho confirmado após o build | `find dist -name main.js` → `dist/main.js` |
| 9 | Porta | `EXPOSE 3000`, `ENV PORT=3000` (`main.ts`: `process.env.PORT ?? 3000`) | `docker image inspect` → `expose={"3000/tcp":{}}` |
| 10 | Segurança | Sem `.env` copiado (`.dockerignore` + `COPY` seletivo); roda como `node` (uid 1000) | `find / -name ".env*"` → nada; `id` → `uid=1000(node)` |

## 4. Validação da saída da compilação (host) [Exec]

```text
$ pnpm build
$ nest build
$ find dist -name "main.js" -o -name "data-source.js"
dist/database/data-source.js
dist/main.js
$ find dist/database -name "*.js"
dist/database/data-source.js
dist/database/migrations/1793060000000-CreateScheduling.js
$ ls dist/database/migrations/
1793060000000-CreateScheduling.d.ts
1793060000000-CreateScheduling.js
1793060000000-CreateScheduling.js.map
```

O `.d.ts` em `dist/` motivou o ajuste do DataSource para filtrar pela extensão do arquivo em execução (10-06 §2).

## 5. Correção aplicada durante a atividade

| Item | Detalhe |
| --- | --- |
| Comando | `docker compose run --rm --no-deps api pnpm migration:show:prod` |
| Sintoma | Falha antes de executar o script |
| Mensagem real | `Error: ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR` / `× installing dependencies` / `Failed to remove /app/node_modules/class-transformer from the modules directory: Permission denied (os error 13)` |
| Hipótese | O pnpm 12 tenta sincronizar dependências antes de `pnpm <script>`; com `--prod` o `node_modules` parece "incompleto", e o usuário `node` não pode alterá-lo |
| Verificações | O binário direto funcionou (`node_modules/.bin/typeorm migration:show ...` → `[X] 1 ...`). `-e npm_config_verify_deps_before_run=false` → **mesma falha**. `-e pnpm_config_verify_deps_before_run=false` → **funcionou** |
| Causa | Verificação de dependências do pnpm 12 antes de rodar scripts; o pnpm 12 lê configurações com prefixo `pnpm_config_` |
| Correção mínima | `ENV pnpm_config_verify_deps_before_run=false` e `ENV pnpm_config_update_notifier=false` no estágio runtime (sem rodar como root e sem mudar permissões) |
| Nova verificação | `docker compose run --rm --no-deps api pnpm migration:show:prod` → `[X] 1 CreateSchedulings1793060000000` |

## 6. Pendências

- `package-lock.json` coexiste com `pnpm-lock.yaml`. A imagem ignora o primeiro (`.dockerignore`); a equipe deve decidir se o remove.
- Imagem de 474 MB (base `bookworm-slim` + dependências de produção). Uma otimização futura seria `pnpm deploy --prod` ou a base `alpine`.
