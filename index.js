// index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { transcribeAudio } = require("./utils/transcribe");
const axios = require("axios");

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

const promptBase = `Você é um atendente virtual da D&F Joias, uma empresa especializada em alianças feitas com ligas semelhantes às de moedas antigas. Siga rigorosamente as diretrizes abaixo ao responder clientes:
- Seja sempre amistoso, persuasivo e gentil. Use emojis quando necessário.
- NUNCA diga que entregamos em todo o Brasil.
- Quando o cliente perguntar sobre entrega, SEMPRE pergunte antes o nome da cidade e do bairro para verificar a disponibilidade.
- Se o cliente não souber a medida, diga que levamos todos os tamanhos e modelos do catálogo para que ele experimente na hora e escolha.
- Só fale da caixinha se o cliente perguntar. Nesse caso, diga que o representante tem para vender.
- NÃO afirme que temos muitos modelos. Trabalhamos apenas com os que estão no catálogo enviado ao cliente.
- Diga que as alianças têm o mesmo tom e brilho do ouro, não desbotam, não descascam e não enferrujam.
- Se o cliente disser que quer comprar hoje, destaque isso na resposta.
- Se o cliente disser que quer comprar depois, registre a data.

Agora responda com base no seguinte contexto de conversa do cliente:`;

// Endpoint que recebe mensagens do Evolution API
app.post("/webhook", async (req, res) => {
  try {
    const { text, audio, phone } = req.body;

    let input = text || "";

    if (audio) {
      const transcript = await transcribeAudio(audio);
      input = transcript || "Não consegui entender o áudio 😔";
    }

    const fullPrompt = `${promptBase}
"${input}"`;

    const completion = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const response = completion.data.choices[0].message.content;

    await axios.post(`${process.env.EVOLUTION_API_URL}/sendMessage`, {
      number: phone,
      text: response,
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao responder cliente:", error.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
