const fetch = require('node-fetch');

exports.askChatbot = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Vui lòng nhập câu hỏi.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: {
            parts: [{
              text: "Bạn là trợ lý AI của hệ thống căn hộ. Chỉ trả lời các câu hỏi liên quan đến thuê nhà, chung cư."
            }]
          }
        }),
      }
    );

    const data = await apiRes.json();

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi.";

    res.json({ response: answer });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gọi AI.' });
  }
};
