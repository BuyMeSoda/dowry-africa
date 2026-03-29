FROM node:20.11-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server build

WORKDIR /app/artifacts/api-server

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
