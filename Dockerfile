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
COPY wait-for-mongo.sh /usr/src/app/wait-for-mongo.sh
RUN chmod +x /usr/src/app/wait-for-mongo.sh


ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "dist/main.js"]