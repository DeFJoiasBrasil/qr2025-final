FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN apt-get update && apt-get install -y wget ca-certificates   libnss3 libxss1 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2   --no-install-recommends && apt-get clean && rm -rf /var/lib/apt/lists/*

CMD [ "npm", "start" ]