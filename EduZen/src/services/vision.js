const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient({
  apiKey: process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY,
});

export const extractTextFromImage = async (imageUrl) => {
  try {
    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;
    return detections.length > 0 ? detections[0].description : '';
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};
