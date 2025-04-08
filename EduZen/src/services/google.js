const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
];
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
];

// Initialize the Google API client
export const initGoogleApi = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES.join(' '),
          })
          .then(resolve)
          .catch(reject);
      });
    };
    document.body.appendChild(script);
  });
};

// Export summary to Google Docs
export const exportToGoogleDocs = async (title, content) => {
  try {
    const docs = window.gapi.client.docs;
    const createResponse = await docs.documents.create({
      title: title,
    });

    const document = createResponse.result;
    await docs.documents.batchUpdate({
      documentId: document.documentId,
      requests: [{
        insertText: {
          location: { index: 1 },
          text: content,
        },
      }],
    });

    return document;
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
};

// Create quiz in Google Forms
export const createGoogleForm = async (title, questions) => {
  try {
    const form = {
      info: {
        title: title,
        documentTitle: title,
      },
      items: questions.map((q, index) => ({
        title: q.question,
        questionItem: {
          question: {
            required: true,
            choiceQuestion: {
              type: 'RADIO',
              options: q.options.map(option => ({
                value: option
              })),
            }
          }
        }
      }))
    };

    const response = await fetch(`https://forms.googleapis.com/v1/forms?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.gapi.auth.getToken().access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Google Form:', error);
    throw error;
  }
};

// Schedule study session in Calendar
export const scheduleStudySession = async (summary, startTime, endTime) => {
  try {
    const event = {
      summary: summary,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
    };

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.result;
  } catch (error) {
    console.error('Error scheduling study session:', error);
    throw error;
  }
};
