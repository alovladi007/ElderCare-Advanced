# Build stage - needs devDependencies (TypeScript, Prisma CLI) to compile.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
RUN npm run build

# Runtime stage - production dependencies plus the compiled output only.
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# sharp needs these at runtime for image processing on Alpine.
RUN apk add --no-cache vips

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Uploads are written at runtime; create the directory owned by the app user.
RUN mkdir -p uploads && chown -R node:node /app

# Never run the application as root.
USER node

EXPOSE 9401

CMD ["node", "dist/main.js"]
