const API_KEY = process.env.REACT_APP_GOOGLE_GEMINI_API_KEY;
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const summarizeText = async (text) => {
  try {
    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please summarize the following text into key points:\n\n${text}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw error;
  }
};

export const generateQuiz = async (text) => {
  try {
    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on the following text, generate 5 multiple-choice questions with 4 options each. Format the response as a JSON array where each question object has properties: question, options (array of 4 strings), and correctAnswer (index of correct option):\n\n${text}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};
