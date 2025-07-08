const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const transcript = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    language: 'pt'
  });
  return transcript.text;
}

module.exports = transcribeAudio;