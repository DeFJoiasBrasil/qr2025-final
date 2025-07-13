require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const multer = require("multer");
const fs = require("fs");
const { OpenAI } = require("openai");
const { transcribeAudio } = require("./utils/transcribe");

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

let qrCodeBase64 = null;
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] }
});

client.on("qr", async (qr) => {
  qrCodeBase64 = await qrcode.toDataURL(qr);
  console.log("✅ QR gerado. Acesse / para escanear.");
});
client.on("ready", () => console.log("✅ WhatsApp conectado!"));
client.initialize();

app.get("/", (req, res) => {
  return qrCodeBase64
    ? res.render("qr", { qrCode: qrCodeBase64 })
    : res.send("QR ainda não gerado. Atualize em alguns segundos...");
});

app.post("/message/send", async (req, res) => {
  const { number, text } = req.body;
  if (!number || !text)
    return res.status(400).json({ error: "Parâmetros ausentes: number/text" });
  try {
    await client.sendMessage(`${number}@c.us`, text);
    return res.json({ status: "Mensagem enviada", to: number });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ dest: "uploads/" });

async function chatGPTReply(contextMessages) {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: contextMessages,
    temperature: 0.7
  });
  return resp.choices[0].message;
}

client.on("message", async msg => {
  try {
    const { from, hasMedia, mimetype } = msg;
    let userText = "";
    const context = [
      { role: "system", content: "Atue com atendimento humanizado de vendas, oferecendo opções, flexibilizando horário, entregas e formas de pagamento." }
    ];

    if (hasMedia && mimetype.startsWith("audio")) {
      const media = await msg.downloadMedia();
      const buffer = Buffer.from(media.data, "base64");
      const filePath = `uploads/${from}.${media.mimetype.split("/")[1]}`;
      fs.writeFileSync(filePath, buffer);
      userText = await transcribeAudio(filePath);
      context.push({ role: "user", content: userText });
      fs.unlinkSync(filePath);
    } else {
      userText = msg.body;
      context.push({ role: "user", content: userText });
    }

    const aiMsg = await chatGPTReply(context);
    const reply = aiMsg.content;
    await client.sendMessage(from, reply);
  } catch (err) {
    console.error("Erro no handler:", err);
  }
});

app.listen(PORT, () => console.log(`🚀 Server up on port ${PORT}`));