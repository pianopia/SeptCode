FROM oven/bun:1

WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile

WORKDIR /app/web
ENV NODE_ENV=production
RUN bun run build

EXPOSE 8080
CMD ["bun", "run", "start"]