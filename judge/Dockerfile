FROM node

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    g++ \
    gcc \
    bash \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN mkdir -p /tmp/executions /app/codes && \
    chmod -R 777 /tmp/executions /app/codes
EXPOSE 4000

CMD ["node", "judge.js"]