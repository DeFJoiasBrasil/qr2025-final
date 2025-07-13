
require('dotenv').config();
const express = require('express');
const { transcribeAudio } = require('./utils/transcribe');
const { default: axios } = require('axios');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const promptBase = `
Você é o atendente virtual da D&F Joias. Sua missão é responder clientes de forma clara, amigável, persuasiva e objetiva. 
Você vende alianças feitas com moedas antigas, que:
- Têm a cor do ouro
- Não desbotam, não descascam, não enferrujam
- Têm garantia permanente da cor
- São entregues presencialmente em algumas cidades e por Correios em outras
- O cliente pode pagar na entrega, no Pix ou parcelado no cartão com acréscimo da maquininha
Sempre pergunte a cidade e bairro para verificar a entrega. Se o cliente não souber o tamanho da aliança, diga que levamos todos os tamanhos. Não diga que temos vários modelos — temos os modelos do catálogo enviado.
`;

async function responderCliente(mensagem, tipo, cliente) {
  if (!mensagem) return;

  let entrada = mensagem;

  if (tipo === "audio") {
    entrada = await transcribeAudio(mensagem);
    if (!entrada) return;
  }

  const promptFinal = `${promptBase}

Cliente: ${entrada}
IA:`;

  const resposta = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o",
    messages: [
      { role: "system", content: promptBase },
      { role: "user", content: entrada }
    ]
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const texto = resposta.data.choices[0].message.content;
  console.log("Resposta da IA:", texto);
  // Aqui você enviaria a resposta para o Evolution API

  return texto;
}

app.get('/', (req, res) => {
  res.render('qr');
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
