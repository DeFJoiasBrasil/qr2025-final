import express from "express";
import { transcribeAudio } from "./utils/transcribe.js";
import { createBot } from "./utils/bot.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 Servidor da IA rodando com sucesso!");
});

createBot(); // inicializa o bot WhatsApp

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
