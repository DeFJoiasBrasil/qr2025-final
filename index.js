require('dotenv').config();
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { OpenAI } = require('openai');
const transcribeAudio = require('./utils/transcribe');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let qrCodeBase64 = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  qrCodeBase64 = await qrcode.toDataURL(qr);
  console.log('✅ QR gerado. Acesse / para escanear.');
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const promptBase = `Você é um assistente de atendimento da D&F Joias.
Seu papel é conversar com clientes interessados em comprar alianças feitas com moedas antigas.
Essas alianças são de excelente qualidade, não desbotam, não enferrujam, têm o brilho semelhante ao do ouro e possuem garantia vitalícia da cor.
A D&F Joias está há 11 anos no mercado e realiza entregas presenciais em todo o Brasil.
O pagamento é feito na hora da entrega, podendo ser em dinheiro, pix ou cartão.
Ao final da conversa, quando o cliente confirmar a compra ou desejar agendar uma data para receber, diga apenas “✅ Compra confirmada” e finalize.`;

client.on('message', async (msg) => {
  try {
    if (msg.body || msg.hasMedia) {
      let userInput = msg.body;

      if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (media.mimetype.includes('audio')) {
          const buffer = Buffer.from(media.data, 'base64');
          const filePath = `./temp_${Date.now()}.ogg`;
          fs.writeFileSync(filePath, buffer);
          userInput = await transcribeAudio(filePath);
          fs.unlinkSync(filePath);
        }
      }

      const chatHistory = `${promptBase}
Cliente: ${userInput}
Atendente:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: promptBase },
          { role: 'user', content: userInput }
        ]
      });

      const reply = response.choices[0].message.content;
      await msg.reply(reply);
      console.log(`🤖 Resposta enviada: ${reply}`);
    }
  } catch (err) {
    console.error('❌ Erro ao responder:', err.message);
  }
});

client.initialize();

app.get('/', (req, res) => {
  if (qrCodeBase64) {
    res.render('qr', { qrCode: qrCodeBase64 });
  } else {
    res.send('QR ainda não gerado. Atualize em alguns segundos...');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});