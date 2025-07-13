const { OpenAI } = require("openai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(audioUrl) {
  const filePath = path.resolve(__dirname, "temp.ogg");
  const response = await axios.get(audioUrl, { responseType: "stream" });
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise(resolve => writer.on("finish", resolve));

  const transcript = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1"
  });

  fs.unlinkSync(filePath);
  return transcript.text;
}

module.exports = { transcribeAudio };
