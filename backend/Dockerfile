FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma
RUN yarn db:generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "src/server.js"]
