// Direct implementation using fetch API
const API_KEY = process.env.REACT_APP_GOOGLE_GEMINI_API_KEY;
// Using the latest API endpoint with the current model name
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const getGeminiResponse = async (query) => {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    console.log('Sending request to Gemini API with query:', query);

    // Add a pre-prompt to make Gemini respond like a study advisor
    const prePrompt = `You are EduZen's Well-Being Assistant, a supportive and knowledgeable study advisor. 
    Your role is to help students learn effectively, manage their study time, and maintain their well-being.
    
    Please follow these guidelines in all your responses:
    1. Use a warm, encouraging, and conversational tone as if you're speaking directly to the student
    2. Provide practical, actionable advice that students can immediately apply
    3. Be empathetic and understanding of the challenges students face
    4. Format your responses as plain text only - do not use markdown formatting like **bold**, *italics*, or code blocks
    5. Break complex concepts into simple, digestible explanations
    6. Offer specific study techniques, time management strategies, and well-being practices
    7. Personalize your advice based on the student's specific situation
    8. Be concise but thorough in your explanations
    
    Now, please respond to the following query from the student:
    `;

    const fullQuery = prePrompt + query;

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
                text: fullQuery
              }
            ]
          }
        ],
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
  const prompt = `Please summarize the following text in a clear, conversational way that a student would find helpful. Focus on creating a summary that helps understand and remember the content. Avoid using any markdown formatting like asterisks for emphasis. Write as if you're directly speaking to the student:

  ${text}
  
  Remember to:
  1. Use plain, conversational language
  2. Do NOT use any markdown formatting (no asterisks, no bold, no italics)
  3. Present information in a friendly, advisor-like tone
  4. Organize key points in a logical flow
  5. Keep your summary concise but comprehensive`;
  
  return getGeminiResponse(prompt);
};

// Helper function for quiz generation
export const generateQuiz = async (text) => {
  try {
    const prompt = `Based on the following content, create a quiz with 5 multiple-choice questions to test understanding of the key concepts. Format the response as a JSON array of objects, where each object represents a question with the following structure:
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0 // Index of the correct answer (0-based)
    }
    
    Content to create questions from:
    ${text}
    
    Important guidelines:
    1. Use plain, conversational language in your questions
    2. Do NOT use any markdown formatting (no asterisks, no bold, no italics)
    3. Make sure each question has exactly 4 options
    4. Ensure the correctAnswer index is valid (0-3)
    5. Make questions that test understanding, not just recall
    6. Write in a friendly, conversational tone as if you're a helpful advisor or tutor
    
    Return ONLY the JSON array without any additional text or explanation.`;
    
    const response = await getGeminiResponse(prompt);
    
    try {
      // Find JSON array in the response text
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        console.error('Could not extract valid JSON array from response');
        return generateTextQuiz(text);
      }
    } catch (error) {
      console.error('Error parsing quiz JSON:', error);
      return generateTextQuiz(text);
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    return generateTextQuiz(text);
  }
};

// Fallback function for text-based quiz generation
export const generateTextQuiz = async (text) => {
  try {
    // Create a simple fallback quiz
    return [
      {
        question: 'What is the main topic of the content?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0
      },
      {
        question: 'Which concept is most important in the material?',
        options: ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'],
        correctAnswer: 1
      }
    ];
  } catch (error) {
    console.error('Error generating text quiz:', error);
    throw error;
  }
};

// Function to analyze images with Gemini
export const analyzeImageWithGemini = async (imageFile) => {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    console.log('Preparing image for Gemini API analysis');
    
    // Convert image to base64
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageFile);
    });
    
    // Use the latest Gemini model for image analysis (gemini-1.5-flash)
    const visionApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    console.log('Sending image to Gemini Vision API');
    
    const response = await fetch(`${visionApiUrl}?key=${API_KEY}`, {
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
                text: "Extract all the text from this image. Then, provide a comprehensive analysis of the content in a conversational, advisor-like tone. Focus on key concepts, definitions, and important points. Format your response as plain text without any markdown formatting like asterisks for bold or emphasis. Write as if you're directly speaking to a student who wants to learn this material."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini Vision API error:', response.status, errorData);
      throw new Error(`Gemini Vision API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini Vision API response received');

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Empty response from Gemini Vision API');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    return textResponse;
  } catch (error) {
    console.error('Error in analyzeImageWithGemini:', error);
    throw error;
  }
};

// Format text by removing markdown formatting
export const formatText = (text) => {
  if (!text) return '';
  
  // Remove bold formatting
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Remove italic formatting
  formatted = formatted.replace(/\*(.*?)\*/g, '$1');
  
  // Remove code blocks
  formatted = formatted.replace(/```(.*?)```/gs, '$1');
  
  // Remove inline code
  formatted = formatted.replace(/`(.*?)`/g, '$1');
  
  // Remove headers
  formatted = formatted.replace(/#{1,6}\s+(.+)/g, '$1');
  
  return formatted;
};

// Summarize PDF text using Gemini API
export const summarizePDFWithGemini = async (pdfText) => {
  try {
    const prompt = `
    Please summarize the following PDF content in a clear, conversational way that a student would find helpful. Focus on the key concepts, main points, and important details. 
    
    PDF content:
    ${pdfText}
    
    Important guidelines:
    1. Use plain, conversational language
    2. Do NOT use any markdown formatting (no asterisks, no bold, no italics)
    3. Present information in a friendly, advisor-like tone
    4. Organize key points in a logical flow
    5. Keep your summary concise but comprehensive
    `;
    
    return getGeminiResponse(prompt);
  } catch (error) {
    console.error('Error summarizing PDF with Gemini:', error);
    throw error;
  }
};

// Generate quiz questions from PDF content using Gemini API
export const generatePDFQuiz = async (pdfText) => {
  try {
    const prompt = `
    Based on the following PDF content, create a quiz with 5 multiple-choice questions to test understanding of the key concepts. Format the response as a JSON array of objects, where each object represents a question with the following structure:
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0 // Index of the correct answer (0-based)
    }
    
    PDF content:
    ${pdfText}
    
    Important guidelines:
    1. Use plain, conversational language in your questions
    2. Do NOT use any markdown formatting (no asterisks, no bold, no italics)
    3. Make sure each question has exactly 4 options
    4. Ensure the correctAnswer index is valid (0-3)
    5. Make questions that test understanding, not just recall
    6. Write in a friendly, conversational tone as if you're a helpful advisor or tutor
    
    Return ONLY the JSON array without any additional text or explanation.
    `;
    
    const response = await getGeminiResponse(prompt);
    
    try {
      // Find JSON array in the response text
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        console.error('Could not extract valid JSON array from response');
        return generateTextQuiz(pdfText);
      }
    } catch (error) {
      console.error('Error parsing PDF quiz JSON:', error);
      return generateTextQuiz(pdfText);
    }
  } catch (error) {
    console.error('Error generating PDF quiz:', error);
    return generateTextQuiz(pdfText);
  }
};

// Analyze PDF with Gemini Vision API
export const analyzePDFWithGemini = async (pdfFile) => {
  try {
    // Convert PDF to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(pdfFile);
    });

    // Prepare the request body for Gemini Vision API
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Please analyze this PDF document and extract all the text content. Then provide a comprehensive summary of the key concepts, main points, and important details. Focus on creating a response that would help a student understand and learn from this material.

              Important guidelines:
              1. Use plain, conversational language
              2. Do NOT use any markdown formatting (no asterisks, no bold, no italics)
              3. Present information in a friendly, advisor-like tone as if you're directly speaking to the student
              4. Organize key points in a logical flow
              5. Keep your summary concise but comprehensive
              
              The PDF is titled: "${pdfFile.name}"
              `
            },
            {
              inline_data: {
                mime_type: pdfFile.type,
                data: base64PDF
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      }
    };

    // Make the API request
    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini Vision API error:', errorData);
      throw new Error(`Gemini Vision API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini Vision API');
    }

    // Extract the text from the response
    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    console.error('Error analyzing PDF with Gemini:', error);
    throw error;
  }
};

/**
 * Generate a study plan from PDF content using Gemini API
 * @param {string} pdfContent - The content extracted from a PDF
 * @param {Object} preferences - User preferences for the study plan
 * @returns {Promise<Object>} - The generated study plan
 */
export const generatePDFStudyPlan = async (pdfContent, preferences) => {
  try {
    const { difficulty, timeAvailable, daysToComplete, learningStyle } = preferences;
    
    const prompt = `
    Create a personalized study plan for a student based on the following PDF content and preferences.
    
    PDF content:
    ${pdfContent}
    
    Student preferences:
    - Difficulty level: ${difficulty} (1-5, where 5 is most difficult)
    - Available study time per day: ${timeAvailable} minutes
    - Days to complete: ${daysToComplete} days
    - Learning style preference: ${learningStyle}
    
    Please create a structured study plan that includes:
    1. A breakdown of topics to cover each day
    2. Recommended study sessions with durations
    3. Strategic breaks to maintain focus
    4. Review sessions to reinforce learning
    5. Practice activities or exercises
    
    Format your response as a JSON object with this structure:
    {
      "overview": "Brief overview of the study plan approach",
      "days": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "sessions": [
            {
              "title": "Session title",
              "type": "study|break|review|practice",
              "duration": 30,
              "topics": ["Topic 1", "Topic 2"],
              "description": "Description of what to do in this session"
            }
          ]
        }
      ],
      "tips": ["Study tip 1", "Study tip 2"]
    }
    
    Ensure the plan is realistic, balanced, and tailored to the student's preferences. Write in a friendly, conversational tone without using markdown formatting.
    `;
    
    const response = await getGeminiResponse(prompt);
    
    // Extract JSON from the response
    try {
      // Find JSON object in the response text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        console.error('Could not extract valid JSON from response');
        throw new Error('Failed to generate a valid study plan from PDF content');
      }
    } catch (error) {
      console.error('Error parsing study plan JSON:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error generating study plan from PDF:', error);
    throw error;
  }
};
