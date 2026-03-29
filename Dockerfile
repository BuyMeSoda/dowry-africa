FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm@8

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

COPY artifacts/ ./artifacts/
COPY lib/ ./lib/

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server build

WORKDIR /app/artifacts/api-server

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
