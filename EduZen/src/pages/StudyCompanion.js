import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const StudyCompanion = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);

  const steps = ['Upload Notes', 'Extract Text', 'Generate Summary', 'Create Quiz'];

  const handleImageUpload = async (event) => {
    try {
      setLoading(true);
      const file = event.target.files[0];
      const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      setUploadedImage(imageUrl);
      setActiveStep(1);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractText = async () => {
    // TODO: Implement Google Cloud Vision API text extraction
    setActiveStep(2);
  };

  const generateSummary = async () => {
    // TODO: Implement Google Gemini API summarization
    setActiveStep(3);
  };

  const generateQuiz = async () => {
    // TODO: Implement quiz generation using Gemini API
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" p={3}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              onChange={handleImageUpload}
            />
            <label htmlFor="image-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                size="large"
              >
                Upload Notes or Textbook Page
              </Button>
            </label>
          </Box>
        );
      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Extracting Text...
              </Typography>
              <Button
                variant="contained"
                onClick={extractText}
                disabled={loading}
              >
                Start Text Extraction
              </Button>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generating Summary
              </Typography>
              <Button
                variant="contained"
                onClick={generateSummary}
                disabled={loading}
              >
                Generate Summary
              </Button>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Creating Quiz
              </Typography>
              <Button
                variant="contained"
                onClick={generateQuiz}
                disabled={loading}
              >
                Generate Quiz
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Study Companion
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent(activeStep)
        )}
      </Paper>

      {summary && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Typography>{summary}</Typography>
        </Paper>
      )}

      {quiz.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Practice Quiz
          </Typography>
          {/* Quiz component will be implemented here */}
        </Paper>
      )}
    </Container>
  );
};

export default StudyCompanion;
