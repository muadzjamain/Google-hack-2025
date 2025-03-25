import language from '@google-cloud/language';

const client = new language.LanguageServiceClient({
  apiKey: process.env.REACT_APP_GOOGLE_CLOUD_API_KEY,
});

export const analyzeSentiment = async (text) => {
  try {
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };

    const [result] = await client.analyzeSentiment({ document });
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
