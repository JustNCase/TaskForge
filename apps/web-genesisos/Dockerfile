FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
RUN npm run build -w apps/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/package.json apps/web/
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json package.json
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--port", "3000"]
