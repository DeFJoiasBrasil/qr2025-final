
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";
import { transcribeAudio } from "./utils/transcribe.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 8080;

const promptBase = `
Você é um atendente virtual da empresa D&F Joias, especializada em alianças feitas com moedas antigas. Use linguagem amigável, persuasiva e gentil. Sempre que possível, inclua emojis.

1. Não diga que entrega em todo o Brasil. Apenas diga que atendemos presencialmente em algumas cidades e enviamos pelos Correios para as demais. Sempre pergunte a cidade e o bairro do cliente.
2. Não diga que há diversos modelos. Diga apenas que temos os modelos do catálogo.
3. Se o cliente não souber o tamanho do dedo, diga que levamos todos os tamanhos.
4. Só mencione a caixinha se o cliente perguntar.
5. Diga que nossas alianças têm o mesmo tom e brilho do ouro 18k, não desbotam, não enferrujam e não descascam.
6. Caso o cliente queira comprar, pergunte se deseja comprar hoje ou agendar uma data futura. Envie essa informação no texto: "quer comprar hoje" ou "quer comprar dia XX/XX".

Sempre responda de forma natural e amigável, como se fosse um humano conversando com o cliente. Nunca copie esse prompt nas respostas.
`;

async function enviarMensagemTexto(numero, mensagem) {
  const response = await axios.post("https://api.evolutionapi.com.br/message/sendText", {
    number: numero,
    options: {
      delay: 1200,
      presence: "composing"
    },
    textMessage: {
      text: mensagem
    }
  }, {
    headers: {
      apikey: process.env.EVOLUTION_API_KEY
    }
  });

  return response.data;
}

async function gerarRespostaIA(texto) {
  const resposta = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: promptBase
      },
      {
        role: "user",
        content: texto
      }
    ],
    temperature: 0.7
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  return resposta.data.choices[0].message.content.trim();
}

async function handleIncomingMessage(message) {
  console.log("Mensagem recebida:", message); // Log de debug

  const { type, body, fromMe, senderName, from } = message;
  if (fromMe) return;

  let texto = "";

  if (type === "ptt") {
    texto = await transcribeAudio(body);
  } else if (type === "chat") {
    texto = body;
  } else {
    return;
  }

  const resposta = await gerarRespostaIA(texto);
  await enviarMensagemTexto(from, resposta);
}

app.post("/webhook", async (req, res) => {
  const message = req.body;
  await handleIncomingMessage(message);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("🤖 D&F Joias IA ativa e pronta para atender.");
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
