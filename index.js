const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const fetch = require('node-fetch');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

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

client.on('message', async (msg) => {
  const number = msg.from;
  const content = msg.body || '[áudio]';

  try {
    await fetch('https://qr2025.up.railway.app/vendedor-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, content })
    });
  } catch (err) {
    console.error('Erro ao chamar vendedor IA:', err.message);
  }
});

app.get('/', (req, res) => {
  if (qrCodeBase64) {
    res.render('qr', { qrCode: qrCodeBase64 });
  } else {
    res.send('QR ainda não gerado. Atualize em alguns segundos...');
  }
});

app.post('/message/sendWhatsappText/default', async (req, res) => {
  const { number, text } = req.body;

  if (!number || !text) {
    return res.status(400).json({ error: 'Parâmetros ausentes: number ou text' });
  }

  try {
    await client.sendMessage(`${number}@c.us`, text);
    console.log(`📤 Mensagem enviada para ${number}: ${text}`);
    res.status(200).json({ status: 'Mensagem enviada com sucesso', to: number, text });
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.message);
    res.status(500).json({ error: 'Erro ao enviar mensagem', detail: err.message });
  }
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function gerarRespostaIA(input) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Você é um vendedor da D&F Joias. Ajude o cliente, conduza até a compra e, se ele quiser comprar, pergunte se deseja hoje ou em outra data.' },
      { role: 'user', content: input }
    ]
  });
  return completion.data.choices[0].message.content;
}

app.post('/vendedor-ia', async (req, res) => {
  const { number, content } = req.body;
  if (!number || !content) {
    return res.status(400).json({ error: 'Parâmetros ausentes' });
  }

  try {
    const resposta = await gerarRespostaIA(content);
    await client.sendMessage(`${number}`, resposta);
    return res.status(200).json({ status: 'Respondido pela IA' });
  } catch (err) {
    console.error('Erro IA:', err.message);
    return res.status(500).json({ error: 'Erro ao responder com IA' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
