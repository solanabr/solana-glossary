FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# Copy locale files to the same path they'll be resolved at runtime
COPY --from=builder /app/src/i18n/locales ./dist/i18n/locales
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
