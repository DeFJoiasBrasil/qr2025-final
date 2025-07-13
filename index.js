const express = require('express');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

let qrCode = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('qr', (qr) => {
    qrCode = qr;
    console.log("✅ QR gerado. Acesse http://localhost:" + PORT + " para escanear.");
    qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("✅ WhatsApp conectado com sucesso!");
});

client.initialize();

app.get('/', (req, res) => {
    if (!qrCode) {
        return res.send('QR ainda não gerado. Atualize em alguns segundos...');
    }
    res.send(`
        <html>
            <body style="text-align: center; font-family: sans-serif; margin-top: 50px;">
                <h2>Escaneie o QR Code abaixo com seu WhatsApp:</h2>
                <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=300x300" />
                <p>Depois de escanear, aguarde a conexão...</p>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});