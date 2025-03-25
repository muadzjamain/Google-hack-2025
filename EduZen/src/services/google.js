import { google } from 'googleapis';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
  'https://www.googleapis.com/discovery/v1/apis/forms/v1/rest',
];
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/forms',
];

// Initialize the Google API client
export const initGoogleApi = () => {
  return new Promise((resolve, reject) => {
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

    return document.documentId;
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);
    throw error;
  }
};

// Create quiz in Google Forms
export const createGoogleForm = async (title, questions) => {
  try {
    const forms = window.gapi.client.forms;
    const form = await forms.create({
      info: {
        title: title,
        documentTitle: title,
      },
    });

    const formId = form.result.formId;
    const requests = questions.map(question => ({
      createItem: {
        item: {
          title: question.question,
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: question.options.map(option => ({ value: option })),
              },
            },
          },
        },
        location: { index: 0 },
      },
    }));

    await forms.batchUpdate({
      formId: formId,
      requests: requests,
    });

    return formId;
  } catch (error) {
    console.error('Error creating Google Form:', error);
    throw error;
  }
};

// Schedule study session in Calendar
export const scheduleStudySession = async (summary, startTime, endTime) => {
  try {
    const calendar = window.gapi.client.calendar;
    const event = {
      summary: summary,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.result;
  } catch (error) {
    console.error('Error scheduling study session:', error);
    throw error;
  }
};
