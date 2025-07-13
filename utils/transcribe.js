const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(base64Audio) {
  const buffer = Buffer.from(base64Audio, "base64");
  const filePath = path.join(__dirname, "temp.ogg");
  fs.writeFileSync(filePath, buffer);

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });
    return transcription.text;
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return null;
  } finally {
    fs.unlinkSync(filePath);
  }
}

module.exports = { transcribeAudio };
