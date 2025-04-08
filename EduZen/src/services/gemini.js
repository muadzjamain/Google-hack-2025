// Direct implementation using fetch API
const API_KEY = process.env.REACT_APP_GOOGLE_GEMINI_API_KEY;
// Using the legacy API endpoint that works with the Generative Language API key
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const getGeminiResponse = async (query) => {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    console.log('Sending request to Gemini API with query:', query);

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: query
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: "You are a helpful well-being assistant. Respond in plain text format without using markdown symbols like asterisks (**) for emphasis. Use simple paragraphs with line breaks for structure. Keep your responses concise, friendly, and easy to read."
            }
          ]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    return textResponse;
  } catch (error) {
    console.error('Error in getGeminiResponse:', error);
    throw error;
  }
};

// Helper function for text summarization
export const summarizeText = async (text) => {
  return getGeminiResponse(`Please summarize the following text into key points:\n\n${text}`);
};

// Helper function for quiz generation
export const generateQuiz = async (text) => {
  const response = await getGeminiResponse(
    `Please create a short quiz based on this text:\n\n${text}\n\nGenerate 3 multiple choice questions.`
  );
  return response;
};
