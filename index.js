require('dotenv').config();
const express = require('express');
const { transcribeAudio } = require('./utils/transcribe');
const { Evolution } = require('@evolutionapi/evolution-node');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 8080;

const evolution = new Evolution({
  apiKey: process.env.EVOLUTION_API_KEY,
  projectId: process.env.EVOLUTION_PROJECT_ID
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const promptBase = `
Você é um vendedor da D&F Joias. Seu trabalho é responder com gentileza, simpatia e clareza os clientes que enviarem mensagens por ÁUDIO. Só responda mensagens de voz. Quando receber áudios, use o conteúdo transcrito para responder. Nunca responda mensagens de texto, imagens ou localizações. Quando for áudio, responda de forma persuasiva, clara, com emojis e siga o seguinte padrão:

1. Fale que temos modelos disponíveis com pronta entrega.
2. Que os modelos estão no catálogo enviado.
3. Que levamos todos os tamanhos até o cliente, ele pode experimentar e escolher na hora.
4. Se ele disser que quer comprar, peça o endereço e diga que já vai agendar.
5. Se não souber o tamanho, diga que não tem problema, o representante leva todos.
6. Sempre que possível, conduza para o fechamento com frases como "posso agendar pra hoje?" ou "me passa o endereço completo".

Nunca mencione que entrega em todo o Brasil. Sempre pergunte cidade e bairro antes.
`;

evolution.onMessage(async (message) => {
  try {
    const { type, from, audio } = message;

    if (type !== 'audio' || !audio?.url) {
      return; // Só responde áudios
    }

    const transcript = await transcribeAudio(audio.url);
    if (!transcript) return;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: promptBase },
        { role: 'user', content: transcript }
      ]
    });

    const reply = completion.choices[0].message.content.trim();
    await evolution.sendMessage({ to: from, type: 'audio', message: reply });

  } catch (err) {
    console.error('Erro no processamento de áudio:', err);
  }
});

app.get('/', (req, res) => {
  res.send('🤖 IA da D&F Joias respondendo apenas áudios!');
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
