const projectId = process.env.REACT_APP_DIALOGFLOW_PROJECT_ID;
const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

export const detectIntent = async (text, sessionId) => {
  try {
    const response = await fetch(
      `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${sessionId}:detectIntent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryInput: {
            text: {
              text: text,
              languageCode: 'en-US',
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      text: result.queryResult.fulfillmentText,
      intent: result.queryResult.intent.displayName,
      confidence: result.queryResult.intentDetectionConfidence,
    };
  } catch (error) {
    console.error('Error detecting intent:', error);
    return {
      text: "I'm having trouble understanding right now. Could you try rephrasing that?",
      intent: null,
      confidence: 0,
    };
  }
};
