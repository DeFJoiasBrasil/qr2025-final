const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = 8080;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR Code recebido');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
});

client.on('message', async msg => {
    if (msg.body && !msg.fromMe) {
        await msg.reply('🤖 Olá! Recebemos sua mensagem e vamos te atender em instantes.');
    }
});

client.initialize();

app.get('/', (req, res) => {
    res.send('🤖 Servidor rodando e WhatsApp conectado!');
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
});