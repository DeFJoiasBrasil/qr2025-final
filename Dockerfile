FROM node:18-bullseye

WORKDIR /app

# Instala dependências do sistema para o puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libdrm2 \
    libgbm1 \
    libxshmfence1 \
    libgobject-2.0-0 \
    xdg-utils \
    fonts-liberation \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

CMD ["node", "index.js"]
