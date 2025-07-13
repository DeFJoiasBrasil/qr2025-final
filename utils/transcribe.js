const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function transcribeAudio(filePath) {
  const file = fs.createReadStream(filePath);
  const response = await openai.createTranscription(file, 'whisper-1');
  return response.data.text;
}

module.exports = { transcribeAudio };