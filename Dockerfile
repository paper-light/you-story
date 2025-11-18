# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOADS=1
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ARG ENV
ARG PUBLIC_PB_URL
ARG MEILI_URL
ARG LANGFUSE_PUBLIC_KEY
ARG LANGFUSE_BASE_URL
ARG PB_EMAIL
ARG PB_PASSWORD
ARG MEILI_MASTER_KEY
ARG LANGFUSE_SECRET_KEY
ARG VOYAGE_API_KEY
ARG GROK_API_KEY
ARG OPENAI_API_KEY
ENV ENV=$ENV PUBLIC_PB_URL=$PUBLIC_PB_URL MEILI_URL=$MEILI_URL LANGFUSE_PUBLIC_KEY=$LANGFUSE_PUBLIC_KEY LANGFUSE_BASE_URL=$LANGFUSE_BASE_URL PB_EMAIL=$PB_EMAIL PB_PASSWORD=$PB_PASSWORD MEILI_MASTER_KEY=$MEILI_MASTER_KEY LANGFUSE_SECRET_KEY=$LANGFUSE_SECRET_KEY VOYAGE_API_KEY=$VOYAGE_API_KEY GROK_API_KEY=$GROK_API_KEY OPENAI_API_KEY=$OPENAI_API_KEY

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "build/index.js"]

