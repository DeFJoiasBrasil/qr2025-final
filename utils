const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(buffer) {
  const filePath = path.join(__dirname, 'temp.ogg');
  fs.writeFileSync(filePath, buffer);

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
  });

  fs.unlinkSync(filePath);
  return transcription.text;
}

module.exports = transcribeAudio;
