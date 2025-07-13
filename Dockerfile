# Imagem base oficial do Puppeteer com Chrome e Node.js
FROM ghcr.io/puppeteer/puppeteer:latest

# Define diretório de trabalho
WORKDIR /app

# Copia os arquivos do projeto
COPY . .

# Instala as dependências
RUN npm install

# Expõe a porta do Express
EXPOSE 8080

# Inicia a aplicação
CMD ["npm", "start"]
