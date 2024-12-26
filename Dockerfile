# Dockerfile
FROM node:22.11.0-slim AS base

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable
RUN pnpm install --prod --frozen-lockfile
RUN pnpm add @nestjs/cli prisma

FROM base AS prisma

WORKDIR /app
VOLUME /app/data

ENV DATABASE_URL="file:../data/db/dev.db"

COPY --from=base /app /app
COPY . .

RUN pnpm run db:generate
RUN pnpm run db:deploy

FROM prisma AS build

WORKDIR /app

COPY --from=prisma /app /app

RUN pnpm run build
RUN pnpm prune --prod

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=log

CMD [ "node", "dist/src/main" ]
