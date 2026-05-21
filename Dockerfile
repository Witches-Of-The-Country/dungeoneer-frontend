# ==========================================
# ESTÁGIO 1: Instalação de Dependências
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app
# Copia apenas os arquivos de dependência primeiro (otimiza o cache do Docker)
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# ESTÁGIO 2: Build (A Forja)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
# Pega as dependências instaladas no passo anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compila o Next.js (Gera a pasta oculta .next otimizada)
RUN npm run build

# ==========================================
# ESTÁGIO 3: Produção (A Taverna)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Copia APENAS os arquivos compilados e as dependências necessárias para rodar
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Inicia o servidor do Next.js
CMD ["npm", "start"]