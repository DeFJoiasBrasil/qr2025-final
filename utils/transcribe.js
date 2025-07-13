const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(audioUrl) {
  try {
    const filePath = path.join('/tmp', 'audio.ogg');
    const writer = fs.createWriteStream(filePath);

    const response = await axios.get(audioUrl, { responseType: 'stream' });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1'
    });

    return transcription.text;
  } catch (err) {
    console.error('Erro ao transcrever:', err);
    return null;
  }
}

module.exports = { transcribeAudio };
