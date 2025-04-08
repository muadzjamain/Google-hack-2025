const API_KEY = process.env.REACT_APP_GOOGLE_CLOUD_API_KEY;
const API_ENDPOINT = 'https://language.googleapis.com/v1/documents:analyzeSentiment';

export const analyzeSentiment = async (text) => {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      magnitude: 0,
      isStressed: false
    };
  }

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
      const errorText = await response.text();
      console.error('Sentiment API error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.documentSentiment) {
      throw new Error('Invalid response from Sentiment API');
    }

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
    // Return neutral sentiment on error
    return {
      score: 0,
      magnitude: 0,
      isStressed: false
    };
  }
};
