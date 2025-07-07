
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { OpenAI } = require('openai');
const app = express();
const PORT = process.env.PORT || 8080;

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.on('qr', async (qr) => {
  qrCodeBase64 = await qrcode.toDataURL(qr);
  console.log('✅ QR gerado. Acesse / para escanear.');
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
});

client.on('message', async (msg) => {
  const contact = await msg.getContact();
  if (contact.isMe) return;

  if (msg.hasMedia && msg.type === 'audio') {
    await msg.reply("🎧 Recebi seu áudio! Vou responder em instantes...");
    return;
  }

  const prompt = `
Você é uma vendedora experiente, simpática e objetiva. Responda a esta mensagem como se estivesse atendendo pelo WhatsApp de uma loja de joias. Seja breve e mostre entusiasmo.

Mensagem do cliente:
"${msg.body}"
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    const resposta = completion.choices[0].message.content.trim();
    await msg.reply(resposta);
    console.log(`🤖 Resposta enviada para ${contact.number.user}: ${resposta}`);
  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error.message);
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
