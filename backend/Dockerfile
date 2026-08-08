# ============================================================================
# Backend image — multi-stage build for a small production artifact.
# ============================================================================
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
# Local-upload fallback directory
RUN mkdir -p src/uploads
EXPOSE 5000
CMD ["node", "dist/server.js"]
