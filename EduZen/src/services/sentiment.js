const API_KEY = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;
const API_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';

export const analyzeSentiment = async (text) => {
  try {
    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document: {
          content: text,
          type: 'PLAIN_TEXT',
        },
        encodingType: 'UTF8',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const sentiment = result.documentSentiment;

    // Score ranges from -1.0 (negative) to 1.0 (positive)
    // Magnitude indicates the overall strength of emotion
    return {
      score: sentiment.score,
      magnitude: sentiment.magnitude,
      isStressed: sentiment.score < -0.3 || sentiment.magnitude > 0.8,
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
};
