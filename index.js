require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const { transcribeAudio } = require('./utils/transcribe');
const { Configuration, OpenAIApi } = require('openai');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const promptBase = `
Você é um assistente de vendas da D&F Joias.
Sua função é responder clientes que estão interessados em comprar alianças feitas com moedas antigas.
Aqui está como você deve se comportar:

1. Sempre seja amigável, gentil e persuasivo. Use emojis com moderação para criar empatia.
2. Quando perguntarem se desbota ou enferruja, diga:
"As alianças são feitas com moedas antigas reais. Elas não desbotam, não enferrujam e têm o mesmo tom e brilho do ouro. Garantia permanente da cor."
3. Se o cliente não souber o tamanho, diga:
"A gente leva todos os modelos e tamanhos do catálogo para você escolher na hora, sem preocupação com medida!"
4. Se perguntarem sobre entrega, diga:
"Me informa sua cidade e bairro que confirmo aqui se consigo te atender hoje ainda. 😊"
5. Se perguntarem se vende unidade, diga:
"A gente vende sim unidade, par ou kit com três. Pode escolher o que preferir!"

Nunca diga que entrega para todo o Brasil. Sempre confirme o bairro e cidade.
Quando o cliente decidir comprar, finalize com:
"Perfeito! Vou agendar sua entrega com um dos nossos representantes e ele entra em contato rapidinho! Pode me passar seu endereço completo por favor?"

Agora responda o cliente da melhor forma.
`;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let clientWpp;

create().then((client) => {
  clientWpp = client;
  console.log('✅ WhatsApp conectado com sucesso!');

  client.onMessage(async (message) => {
    if (message.isGroupMsg === false) {
      try {
        let userPrompt = '';

        if (message.type === 'ptt') {
          const buffer = await client.decryptFile(message);
          const filename = `audio-${Date.now()}.ogg`;
          fs.writeFileSync(filename, buffer);
          userPrompt = await transcribeAudio(filename);
          fs.unlinkSync(filename);
        } else {
          userPrompt = message.body;
        }

        const completion = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: promptBase },
            { role: 'user', content: userPrompt },
          ],
        });

        const reply = completion.data.choices[0].message.content.trim();
        await client.sendText(message.from, reply);
      } catch (err) {
        console.error('Erro ao responder:', err.message);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('🤖 Bot da D&F Joias rodando com sucesso!');
});

app.listen(8080, () => {
  console.log('🚀 Servidor rodando na porta 8080');
});