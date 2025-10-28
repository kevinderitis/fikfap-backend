FROM node:20-alpine
WORKDIR /app

# toolchains por si argon2 compila
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","src/server.js"]