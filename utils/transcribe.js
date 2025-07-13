// utils/transcribe.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function transcribeAudio(audioBase64) {
  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const filePath = path.join(__dirname, "temp-audio.mp3");
    fs.writeFileSync(filePath, buffer);

    const audioData = fs.createReadStream(filePath);

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        file: audioData,
        model: "whisper-1",
        response_format: "text",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    fs.unlinkSync(filePath);
    return response.data.text;
  } catch (err) {
    console.error("Erro na transcrição:", err.message);
    return null;
  }
}

module.exports = { transcribeAudio };
