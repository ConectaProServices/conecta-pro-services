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
