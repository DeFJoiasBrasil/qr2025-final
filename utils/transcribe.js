const fs = require("fs");
const { OpenAI } = require("openai");

require("dotenv").config();

async function transcribeAudio(client, message) {
  const media = await client.decryptFile(message);
  const filePath = `/tmp/${message.id}.ogg`;
  fs.writeFileSync(filePath, media);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "text",
    });
    return resp;
  } catch (err) {
    console.error("Erro ao transcrever áudio:", err);
    return null;
  } finally {
    fs.unlinkSync(filePath);
  }
}

module.exports = { transcribeAudio };