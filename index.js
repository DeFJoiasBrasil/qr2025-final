require("dotenv").config();
const express = require("express");
const { transcribeAudio } = require("./utils/transcribe");
const { getMessageFromAI } = require("./utils/openai");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const message = req.body;

  if (message.type === "audio") {
    try {
      const transcript = await transcribeAudio(message.audioUrl);
      const aiReply = await getMessageFromAI(transcript);
      // Aqui você pode chamar a API de resposta via Evolution
      console.log("Resposta IA:", aiReply);
    } catch (error) {
      console.error("Erro ao processar áudio:", error);
    }
  }

  res.sendStatus(200);
});

app.listen(8080, () => {
  console.log("🚀 Servidor de IA (áudio) rodando na porta 8080");
});
