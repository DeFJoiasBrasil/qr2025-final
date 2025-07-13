require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode-terminal');
const { create } = require('@open-wa/wa-automate');
const { transcribeAudio } = require('./utils/transcribe');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HumanMessage } = require('langchain/schema');

const app = express();
const PORT = process.env.PORT || 8080;

const promptBase = `Você é um atendente da D&F Joias, uma empresa que vende alianças feitas com moedas antigas. Seja amistoso, persuasivo e gentil, usando emojis quando necessário.
- Nunca diga que entregamos em todo o Brasil. Pergunte sempre a cidade e o bairro.
- Se o cliente não souber a medida, diga que levamos todos os tamanhos.
- Só fale sobre a caixinha se o cliente perguntar.
- Diga que nossas alianças têm o mesmo tom e brilho do ouro, não desbotam, não descascam e não enferrujam.
- Use uma linguagem informal e amigável, como nas mensagens de WhatsApp.
`;

const chat = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.5,
  modelName: "gpt-4o"
});

const start = async () => {
  create({
    qrTimeout: 0,
    authTimeout: 0,
    headless: true,
    useChrome: true,
    executablePath: '/usr/bin/google-chrome-stable',
    puppeteerOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  }).then(client => startClient(client));
};

const startClient = async (client) => {
  app.get("/", (_, res) => res.send("✅ WhatsApp conectado com sucesso!"));

  client.onMessage(async message => {
    if (message.body || message.mimetype === 'audio/ogg; codecs=opus') {
      let userInput = message.body;

      if (message.mimetype === 'audio/ogg; codecs=opus') {
        userInput = await transcribeAudio(message.clientUrl);
      }

      const response = await chat.call([new HumanMessage(`${promptBase}
Cliente: ${userInput}`)]);
      await client.sendText(message.from, response.text);
    }
  });

  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
};

start();
