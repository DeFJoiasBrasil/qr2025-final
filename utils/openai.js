const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function getMessageFromAI(prompt) {
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Você é um atendente da D&F Joias especializado em alianças feitas de moedas antigas." },
      { role: "user", content: prompt },
    ],
  });

  return response.data.choices[0].message.content;
}

module.exports = { getMessageFromAI };
