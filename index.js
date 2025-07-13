require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Servidor IA D&F Joias ativo');
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});