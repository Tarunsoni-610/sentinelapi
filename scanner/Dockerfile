FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
ENV NODE_ENV=production
ENV SCANNER_PORT=5000
EXPOSE 5000
CMD ["node", "src/server.js"]
