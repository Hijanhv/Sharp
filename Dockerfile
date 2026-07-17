# Sharp ASP — minimal container. Runs the TypeScript entry directly via tsx.
FROM node:22-slim

WORKDIR /app

# Install deps first for layer caching.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# App source.
COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787

# tsx is a runtime dep path; ensure it is present in production image.
RUN npm install tsx@^4.23.1 --no-audit --no-fund

CMD ["npx", "tsx", "src/index.ts"]
