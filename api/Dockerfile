FROM oven/bun:1

WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile

WORKDIR /app/api
ENV NODE_ENV=production
EXPOSE 8080

CMD ["bun", "src/index.ts"]
