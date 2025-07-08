require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const transcribeAudio = require('./utils/transcribe');
const { OpenAI } = require('openai');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const promptBase = \`
Você é uma atendente virtual da D&F Joias, especializada em alianças feitas com moedas antigas. Seu trabalho é responder de forma clara, gentil e envolvente, oferecendo informações sobre promoções, formas de pagamento, prazos de entrega e quebra de objeções. Todas as alianças têm garantia permanente da cor, não desbotam nem enferrujam. Quando a cliente disser que quer comprar, você deve pedir o endereço por escrito e a localização, e avisar que o representante fará a entrega. Use sempre um tom acolhedor, objetivo e vendedor.
\`;

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

client.on('message', async (message) => {
  const number = message.from;
  const isAudio = message.hasMedia && message.type === 'audio';
  const isText = message.type === 'chat';

  let userMessage = '';

  try {
    if (isAudio) {
      const media = await message.downloadMedia();
      if (media && media.mimetype.includes('audio')) {
        const buffer = Buffer.from(media.data, 'base64');
        userMessage = await transcribeAudio(buffer);
      }
    } else if (isText) {
      userMessage = message.body;
    }

    if (!userMessage) return;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: promptBase },
        { role: 'user', content: userMessage }
      ]
    });

    const resposta = completion.choices[0].message.content;
    await client.sendMessage(number, resposta);
  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err.message);
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