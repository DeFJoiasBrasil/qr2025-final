require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', async (req, res) => {
  const qr = await qrcode.toDataURL('https://wa.me/556199999999');
  res.send(`<img src="${qr}" />`);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});