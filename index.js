const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

let currentQr = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  currentQr = qr;
  qrcode.generate(qr, { small: true });
  console.log('✅ QR gerado. Acesse / para escanear.');
});

app.get('/', (req, res) => {
  if (currentQr) {
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(currentQr)}&size=300x300`;
    res.render('qr', { qr: imageUrl });
  } else {
    res.send('QR ainda não gerado. Atualize em alguns segundos...');
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
});

client.initialize();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));