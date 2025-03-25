const dialogflow = require('@google-cloud/dialogflow');

const projectId = process.env.REACT_APP_DIALOGFLOW_PROJECT_ID;
const privateKey = process.env.REACT_APP_DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, '\n');
const clientEmail = process.env.REACT_APP_DIALOGFLOW_CLIENT_EMAIL;

const config = {
  credentials: {
    private_key: privateKey,
    client_email: clientEmail,
  },
};

const sessionClient = new dialogflow.SessionsClient(config);

export const detectIntent = async (text, sessionId) => {
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
        languageCode: 'en-US',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    return {
      text: result.fulfillmentText,
      intent: result.intent.displayName,
      confidence: result.intentDetectionConfidence,
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
