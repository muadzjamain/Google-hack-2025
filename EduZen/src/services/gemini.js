const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const summarizeText = async (text) => {
  try {
    const prompt = `Please summarize the following text into key points:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw error;
  }
};

export const generateQuiz = async (text) => {
  try {
    const prompt = `Based on the following text, generate 5 multiple-choice questions with 4 options each. Format the response as a JSON array where each question object has properties: question, options (array of 4 strings), and correctAnswer (index of correct option):\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};
