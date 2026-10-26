# Only needed for Cloud Run. Render builds straight from the repo without this.
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
# Cloud Run injects PORT and expects the process to bind to it.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
