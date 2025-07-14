// index.js
require('dotenv').config();
const express = require('express');
const { transcribeAudio } = require('./utils/transcribe');
const { createOpenAI } = require('openai');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const ejs = require('ejs');

const app = express();
app.use(express.json());

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const promptBase = `
Você é um atendente virtual da D&F Joias, especialista em responder com empatia e foco em vendas. 
Baseie-se nas informações abaixo para responder de forma persuasiva e clara.

- Vendemos alianças feitas com moedas antigas, com o mesmo brilho e tom do ouro.
- As alianças não desbotam, não descascam e não enferrujam.
- Temos todos os tamanhos prontos para entrega.
- Entregamos presencialmente em algumas cidades, e por Correios nas demais.
- Nunca diga que entregamos em todo o Brasil. Pergunte sempre a cidade e o bairro.
- Se o cliente perguntar sobre medidas, diga que levamos todos os tamanhos.
- Garantia permanente da cor.
- A caixa é vendida separadamente e deve ser mencionada apenas se o cliente perguntar.

Fale com leveza, simpatia, segurança e sempre conduza o cliente até a decisão de compra.
Use emojis quando necessário. Responda como se fosse humano.
`;

// Webhook de atendimento com IA
app.post('/webhook', async (req, res) => {
    const { message, isAudio } = req.body;

    try {
        let userMessage = message;

        if (isAudio) {
            userMessage = await transcribeAudio(message); // URL do áudio
        }

        const response = await openai.chat.completions.create({
            messages: [
                { role: "system", content: promptBase },
                { role: "user", content: userMessage }
            ],
            model: "gpt-4o"
        });

        const aiReply = response.choices[0].message.content;
        res.json({ reply: aiReply });
    } catch (error) {
        console.error("Erro no atendimento:", error.message);
        res.status(500).json({ error: "Erro ao processar mensagem" });
    }
});

// Integração com WhatsApp para QR Code
let qrCodeImageUrl = null;
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    qrCodeImageUrl = await qrcode.toDataURL(qr);
    console.log('✅ QR gerado. Acesse / para escanear.');
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
});

client.initialize();

// Rota para ver o QR Code
app.get('/', (req, res) => {
    if (!qrCodeImageUrl) {
        return res.send('⏳ Aguarde... gerando QR Code.');
    }
    res.render('qr', { imageUrl: qrCodeImageUrl });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
