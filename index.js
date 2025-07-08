const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { OpenAI } = require('openai');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8080;

const basePrompt = `
Você é um vendedor treinado da D&F Joias. A empresa vende alianças feitas com moedas antigas, com garantia permanente da cor, pagas somente na entrega. Entregamos em domicílio em todo o Brasil, com representantes locais. Seu papel é conduzir o cliente até a decisão de compra, respondendo dúvidas sobre os produtos, promoções, qualidade, forma de pagamento e agendando a entrega.

Quando o cliente quiser marcar a entrega, peça:
• Endereço completo por escrito
• Localização via WhatsApp

Atenção: seja amigável, direto, confiante e atenda sempre com foco em fechamento.
`;

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

let qrCodeBase64 = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

client.on('qr', async (qr) => {
  qrCodeBase64 = await qrcode.toDataURL(qr);
  console.log('✅ QR gerado. Acesse / para escanear.');
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
});

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  if (msg.fromMe || chat.isGroup) return;

  try {
    const userMsg = msg.body;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: basePrompt },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    await msg.reply(reply);
    console.log(`📩 IA respondeu para ${msg.from}: ${reply}`);
  } catch (err) {
    console.error('❌ Erro ao responder com IA:', err.message);
    await msg.reply('Desculpe, ocorreu um erro ao tentar responder sua mensagem.');
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