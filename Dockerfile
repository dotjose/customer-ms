FROM node:20-alpine AS builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY wait-for-all.sh wait-for-mongo.sh wait-for-redis.sh wait-for-elastic.sh /usr/src/app/
RUN chmod +x /usr/src/app/wait-for-*.sh

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "dist/main.js"]
