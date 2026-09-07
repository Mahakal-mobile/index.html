export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, fileData, mimeType, language } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured on Vercel' });
  }

  try {
    let parts = [];

    // अगर यूजर ने फोटो या फाइल अपलोड की है, तो उसे जोड़ें
    if (fileData && mimeType) {
      parts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType
        }
      });
    }

    // सिस्टम प्रॉम्प्ट जो AI को असली दिमाग और भाषा निर्देश देगा
    const systemInstruction = language === 'hi' 
      ? "आप Guru AI हैं। यूजर द्वारा दिए गए टेक्स्ट, फोटो, वीडियो या दस्तावेज को खुद समझकर, इंटरनेट से सटीक और असली जानकारी (Real Web Search) निकालकर हिंदी में सही और स्पष्ट उत्तर दें।"
      : "You are Guru AI. Analyze the user's text, photo, video, or document intelligently, retrieve accurate real-world data, and provide precise answers in English.";

    parts.push({ text: `${systemInstruction}\n\nUser Query: ${message}` });

    // Gemini 1.5 Flash API कॉल (Google Search Grounding enabled)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        tools: [{ "googleSearch": {} }] // असली इंटरनेट सर्च इनेबल करने के लिए
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process request with Gemini API' });
  }
}
