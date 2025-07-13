# Usa imagem base Node.js com suporte a Puppeteer
FROM node:18-slim

# Evita prompts interativos
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências essenciais para Chrome rodar
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
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
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Cria diretório da aplicação
WORKDIR /app

# Copia arquivos da aplicação
COPY . .

# Instala dependências do projeto
RUN npm install

# Expõe porta usada no Express
EXPOSE 8080

# Comando para iniciar a aplicação
CMD ["npm", "start"]
