const express = require("express");
const { transcribeAudio } = require("./utils/transcribe");
const { create } = require("venom-bot");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

let client;

const promptBase = `
Você é um atendente virtual da D&F Joias, empresa que vende alianças feitas com moedas antigas. Atenda todos os clientes com um tom amistoso, persuasivo e gentil, utilizando emojis quando necessário.

Regras importantes:
1. Jamais diga que entregamos em todo o Brasil. Sempre pergunte "Qual o nome da sua cidade e do seu bairro?" para verificar a disponibilidade.
2. Quando o cliente disser que não sabe o tamanho, responda que levamos todos os tamanhos do catálogo para ele experimentar na hora e escolher.
3. Jamais fale sobre caixinha, a não ser que o cliente pergunte. Nesse caso diga: "A caixinha o representante leva e tem pra vender. Você pode ver com ele na hora 😉"
4. Diga sempre que as alianças têm o mesmo tom e brilho do ouro, não desbotam, não descascam e não enferrujam.
5. Trabalhamos somente com os modelos que enviamos no catálogo. Não temos outros.

Responda com gentileza e precisão, como um vendedor experiente.
`;

create({
  session: "D&F-AI",
  multidevice: true,
})
  .then((clientInstance) => {
    client = clientInstance;
    app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
    });

    client.onMessage(async (message) => {
      if (message.isGroupMsg) return;

      const isAudio = message.mimetype?.includes("audio");
      const content = isAudio
        ? await transcribeAudio(client, message)
        : message.body;

      if (!content) return;

      const response = await generateResponse(content);
      client.sendText(message.from, response);
    });
  })
  .catch((err) => console.error("Erro ao iniciar o cliente:", err));

async function generateResponse(userMessage) {
  const { OpenAI } = require("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: promptBase },
      { role: "user", content: userMessage },
    ],
  });

  return completion.choices[0].message.content;
}