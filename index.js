app.post('/message/sendWhatsappText/default', async (req, res) => {
  const { number, text } = req.body;

  if (!number || !text) {
    return res.status(400).json({ error: 'Parâmetros ausentes: number ou text' });
  }

  try {
    const chatId = `${number}@s.whatsapp.net`;

    const chat = await client.getChatById(chatId).catch(async () => {
      return await client.pupPage.evaluate(async (id) => {
        const contact = await WWebJS.getContact(id);
        return await contact.chat;
      }, chatId);
    });

    await client.sendMessage(chat.id._serialized || chatId, text);

    console.log(`📤 Mensagem enviada para ${number}: ${text}`);
    res.status(200).json({ status: 'Mensagem enviada com sucesso', to: number, text });
  } catch (err) {
    console.error('❌ Erro ao enviar mensagem:', err.message);
    res.status(500).json({ error: 'Erro ao enviar mensagem', detail: err.message });
  }
});
