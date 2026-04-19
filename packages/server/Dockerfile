FROM node:20-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json packages/server/package.json
COPY packages/client/package.json packages/client/package.json
RUN pnpm install --frozen-lockfile

COPY packages/server packages/server
COPY packages/client packages/client
RUN pnpm --filter @loup-garou/server exec prisma generate
RUN pnpm --filter @loup-garou/server build

FROM node:20-alpine AS runtime

WORKDIR /app/packages/server
ENV NODE_ENV=production
RUN corepack enable

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/server/package.json ./package.json
COPY --from=build /app/packages/server/dist ./dist
COPY --from=build /app/packages/server/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]