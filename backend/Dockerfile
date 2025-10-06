FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/submissions && \
    chmod -R 777 /app/submissions

EXPOSE 3000

CMD ["node", "server.js"]