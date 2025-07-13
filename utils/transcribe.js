
const axios = require('axios');
const fs = require('fs');
const { Readable } = require('stream');

async function transcribeAudio(audioUrl) {
  try {
    const audio = await axios.get(audioUrl, { responseType: 'arraybuffer' });

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      audio.data,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'audio/mpeg'
        }
      }
    );

    return response.data.text;
  } catch (err) {
    console.error("Erro ao transcrever áudio:", err.message);
    return null;
  }
}

module.exports = { transcribeAudio };
