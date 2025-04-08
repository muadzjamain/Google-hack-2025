const projectId = process.env.REACT_APP_DIALOGFLOW_PROJECT_ID;
const clientEmail = process.env.REACT_APP_DIALOGFLOW_CLIENT_EMAIL;
const privateKey = process.env.REACT_APP_DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, '\n');

// Function to generate JWT token
const generateJWT = () => {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: privateKey
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://dialogflow.googleapis.com/google.cloud.dialogflow.v2.Sessions',
    iat: now,
    exp: now + 3600
  };

  // Using the Web Crypto API for JWT signing
  const encodeSegment = (segment) => 
    btoa(JSON.stringify(segment))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const signatureInput = `${encodeSegment(header)}.${encodeSegment(payload)}`;
  
  return new Promise(async (resolve) => {
    try {
      // Convert private key to crypto key
      const pemHeader = '-----BEGIN PRIVATE KEY-----';
      const pemFooter = '-----END PRIVATE KEY-----';
      const pemContents = privateKey.substring(
        pemHeader.length,
        privateKey.length - pemFooter.length - 1
      );
      const binaryDer = window.atob(pemContents);
      const binaryDerBuffer = new ArrayBuffer(binaryDer.length);
      const binaryDerView = new Uint8Array(binaryDerBuffer);
      for (let i = 0; i < binaryDer.length; i++) {
        binaryDerView[i] = binaryDer.charCodeAt(i);
      }

      const cryptoKey = await window.crypto.subtle.importKey(
        'pkcs8',
        binaryDerBuffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: { name: 'SHA-256' }
        },
        false,
        ['sign']
      );

      // Sign the JWT
      const textEncoder = new TextEncoder();
      const signatureBuffer = await window.crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        cryptoKey,
        textEncoder.encode(signatureInput)
      );

      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      resolve(`${signatureInput}.${signature}`);
    } catch (error) {
      console.error('Error generating JWT:', error);
      resolve(null);
    }
  });
};

export const detectIntent = async (text, sessionId) => {
  try {
    const jwt = await generateJWT();
    if (!jwt) {
      throw new Error('Failed to generate authentication token');
    }

    const response = await fetch(
      `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${sessionId}:detectIntent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
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
      const errorText = await response.text();
      console.error('Dialogflow error:', errorText);
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
