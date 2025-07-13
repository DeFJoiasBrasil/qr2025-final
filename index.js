const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', './views');

let qrCodeImg = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', async (qr) => {
  qrcode.generate(qr, { small: true });
  const qrDataUrl = await require('qrcode').toDataURL(qr);
  qrCodeImg = qrDataUrl;
  console.log('⚠️ Escaneie o QR Code ou acesse http://localhost:8080 para visualizar no navegador.');
});

app.get('/', (req, res) => {
  if (!qrCodeImg) {
    return res.send('QR Code ainda não gerado, aguarde...');
  }
  res.render('qr', { qr: qrCodeImg });
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
});

client.initialize();

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
