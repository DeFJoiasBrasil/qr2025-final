
const { create } = require('@open-wa/wa-automate');
const express = require('express');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const { transcribeAudio } = require('./utils/transcribe');
const { generateResponse } = require('./utils/openai');

const app = express();
const PORT = process.env.PORT || 8080;

let clientInstance;

const promptBase = `
Você é um atendente de vendas da D&F Joias, especialista em alianças feitas com ligas semelhantes às de moedas antigas. 
Seu objetivo é conduzir o cliente com empatia, clareza e objetividade até o fechamento da venda.
Informações importantes:
- Você só deve falar sobre os modelos que estão no catálogo enviado.
- As alianças não desbotam, não enferrujam e não descascam.
- O atendimento é presencial nas cidades onde temos representantes, e por Correios nas demais.
- Não mencione entrega nacional. Sempre pergunte o bairro e cidade antes de falar de entrega.
- Se o cliente não souber a numeração, diga que levamos todos os tamanhos.
- A caixinha é vendida separadamente. Só mencione se o cliente perguntar.
- Fale de forma amigável e gentil, usando emojis quando apropriado.
`;

create({
    qrTimeout: 0,
    authTimeout: 0,
    headless: true,
    useChrome: false,
    qrPopUpOnly: false,
    multiDevice: true
}).then(client => {
    clientInstance = client;

    client.on('qr', qrCode => {
        qrcode.generate(qrCode, { small: true });
    });

    client.onMessage(async message => {
        if (message.body || message.mimetype) {
            let prompt = "";
            if (message.mimetype === "audio/ogg; codecs=opus") {
                const mediaData = await client.decryptFile(message);
                const filePath = `./audio-${message.id}.ogg`;
                fs.writeFileSync(filePath, mediaData);
                const text = await transcribeAudio(filePath);
                fs.unlinkSync(filePath);
                prompt = text;
            } else {
                prompt = message.body;
            }

            const resposta = await generateResponse(`${promptBase}
Cliente: ${prompt}
Atendente:`);
            client.sendText(message.from, resposta);
        }
    });

    client.onStateChanged(state => {
        console.log('[Estado do cliente]:', state);
    });
}).catch(err => console.error(err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('qr', { message: 'Escaneie o QR Code no terminal para conectar seu WhatsApp.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
