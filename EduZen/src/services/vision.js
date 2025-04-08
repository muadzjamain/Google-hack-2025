const API_KEY = process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY;
const API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

export const extractTextFromImage = async (imageUrl) => {
  try {
    // First, convert the image URL to base64
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });

    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64Image,
          },
          features: [{
            type: 'TEXT_DETECTION',
          }],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const detections = result.responses[0].textAnnotations;
    return detections.length > 0 ? detections[0].description : '';
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};
