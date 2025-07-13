const axios = require("axios");

async function transcribeAudio(audioUrl) {
  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      file: audioUrl,
      model: "whisper-1",
      response_format: "text",
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

module.exports = { transcribeAudio };
