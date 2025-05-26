# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY wait-for-all.sh /usr/src/app/wait-for-all.sh
RUN chmod +x /usr/src/app/wait-for-all.sh

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "dist/main.js"]