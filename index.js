const express = require('express');
const fs = require('fs');
const { transcribeAudio } = require('./utils/transcribe');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('🤖 IA da D&F Joias rodando com sucesso!');
});

app.post('/webhook', async (req, res) => {
  const { type, message } = req.body;

  if (type === 'audio') {
    const text = await transcribeAudio(message);
    // Aqui aplicaria o prompt inteligente com base no texto transcrito
    return res.json({ response: `Transcrição: ${text}` });
  }

  if (type === 'text') {
    // Aqui aplicaria o prompt inteligente com base no texto recebido
    return res.json({ response: `Você disse: ${message}` });
  }

  res.json({ response: 'Mensagem não reconhecida' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});