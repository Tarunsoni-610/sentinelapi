FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
COPY openapi.yaml ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:4000/healthz >/dev/null || exit 1
CMD ["node", "src/server.js"]
