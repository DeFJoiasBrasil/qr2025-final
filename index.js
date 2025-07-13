const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const qrcode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const { transcribeAudio } = require("./utils/transcribe");
require("dotenv").config();
const { OpenAI } = require("openai");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

let qrCodeImage = null;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const promptBase = `
Você é um atendente da D&F Joias, especialista em vender alianças feitas com ligas semelhantes às de moedas antigas. Responda os clientes com um tom amistoso, persuasivo e gentil, incluindo emojis quando necessário.

Regras de atendimento:

- NÃO diga que entregamos em todo o Brasil. Quando perguntarem sobre entrega, solicite o nome da cidade e do bairro para verificar a disponibilidade.
- NÃO diga que temos vários modelos. Diga que trabalhamos apenas com os modelos disponíveis no catálogo enviado.
- Se o cliente não souber a medida: diga que levamos todos os tamanhos e modelos e ele pode experimentar na hora.
- Se o cliente perguntar sobre caixinha, diga que o representante tem para vender.
- As alianças têm o mesmo tom e brilho do ouro, não desbotam, não descascam e não enferrujam.

Agora, responda a próxima mensagem do cliente com base nessas instruções.
`;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", async (qr) => {
  qrCodeImage = await qrcode.toDataURL(qr);
  console.log("✅ QR gerado. Acesse / para escanear.");
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
});

client.on("message", async (msg) => {
  try {
    const contact = await msg.getContact();

    if (msg.hasMedia && msg.type === "audio") {
      const media = await msg.downloadMedia();
      const transcription = await transcribeAudio(media.data);
      if (transcription) {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: promptBase },
            { role: "user", content: transcription },
          ],
          model: "gpt-4o",
        });
        await msg.reply(completion.choices[0].message.content);
      }
    } else if (msg.body) {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: promptBase },
          { role: "user", content: msg.body },
        ],
        model: "gpt-4o",
      });
      await msg.reply(completion.choices[0].message.content);
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err);
  }
});

app.get("/", (req, res) => {
  res.render("qr", { qrCode: qrCodeImage });
});

server.listen(8080, () => {
  console.log("🚀 Servidor rodando na porta 8080");
});
