require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { transcribeAudio } = require("./utils/transcribe");
const { generateResponse } = require("./utils/openai");
const { sendMessage } = require("./utils/send");

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));

const promptBase = `
Você é um assistente de vendas da D&F Joias.
- Responda de forma amigável e persuasiva.
- Sempre use linguagem natural, com emojis quando apropriado.
- Explique os benefícios das alianças feitas com moedas antigas:
  * Não desbotam
  * Não enferrujam
  * Garantia eterna da cor
  * Aparência idêntica ao ouro
- Peça o bairro e cidade do cliente antes de oferecer entrega
- Confirme se o cliente quer comprar hoje ou agendar para outra data
`;

app.post("/webhook", async (req, res) => {
    const msg = req.body.message;
    const from = req.body.from;
    const type = req.body.type;

    try {
        let userInput = "";
        if (type === "audio") {
            userInput = await transcribeAudio(msg);
        } else if (type === "text") {
            userInput = msg;
        }

        const finalPrompt = `${promptBase}

Cliente: ${userInput}
Atendente:`;
        const resposta = await generateResponse(finalPrompt);

        await sendMessage(from, resposta);
        res.sendStatus(200);
    } catch (e) {
        console.error("Erro no webhook:", e);
        res.sendStatus(500);
    }
});

app.listen(8080, () => console.log("🚀 Servidor rodando na porta 8080"));