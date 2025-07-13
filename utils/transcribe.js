
const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
  });
  return transcription.text;
}

module.exports = { transcribeAudio };
