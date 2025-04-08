import React, { useState, useEffect } from 'react';
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
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { extractTextFromImage } from '../services/vision';
import { summarizeText, generateQuiz } from '../services/gemini';
import { exportToGoogleDocs, createGoogleForm, initGoogleApi, scheduleStudySession } from '../services/google';
import { DateTimePicker } from '@mui/lab';
import { addHours } from 'date-fns';
import TextField from '@mui/material/TextField';

const StudyCompanion = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);

  useEffect(() => {
    // Initialize Google API and test AI connections
    initGoogleApi()
      .then(() => {
        setIsGoogleApiReady(true);
        testAIConnections(); // Run the test when component mounts
      })
      .catch(console.error);
  }, []);

  const steps = ['Upload Notes', 'Extract Text', 'Generate Summary', 'Create Quiz'];

  const handleImageUpload = async (event) => {
    try {
      setLoading(true);
      setError(null);
      const file = event.target.files[0];

      // Start text extraction immediately with the File object
      const textExtractionPromise = extractTextFromImage(file);

      // Upload to Firebase Storage in parallel
      const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);
      const uploadPromise = uploadBytes(storageRef).then(() => getDownloadURL(storageRef));

      // Wait for both operations to complete
      const [text, imageUrl] = await Promise.all([textExtractionPromise, uploadPromise]);

      setUploadedImage(imageUrl);
      setExtractedText(text);
      setActiveStep(2);

      // Start summary and quiz generation in parallel
      const [generatedSummary, generatedQuiz] = await Promise.all([
        summarizeText(text),
        generateQuiz(text)
      ]);

      setSummary(generatedSummary);
      setQuiz(generatedQuiz);
      setActiveStep(3);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async (text) => {
    try {
      setLoading(true);
      setError(null);
      const generatedQuiz = await generateQuiz(text || extractedText);
      setQuiz(generatedQuiz);
      
      // Save study session to Firestore
      await addDoc(collection(db, 'studySessions'), {
        timestamp: new Date(),
        imageUrl: uploadedImage,
        extractedText: text || extractedText,
        summary: summary,
        quiz: generatedQuiz,
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / quiz.length) * 100;
  };

  const handleExportToGoogleDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const docId = await exportToGoogleDocs(
        'Study Notes Summary',
        `Original Text:\n${extractedText}\n\nSummary:\n${summary}`
      );
      // Open the document in a new tab
      window.open(`https://docs.google.com/document/d/${docId}/edit`, '_blank');
    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
      setError('Failed to export to Google Docs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoogleForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const formId = await createGoogleForm('Study Quiz', quiz);
      // Open the form in a new tab
      window.open(`https://docs.google.com/forms/d/${formId}/edit`, '_blank');
    } catch (error) {
      console.error('Error creating Google Form:', error);
      setError('Failed to create Google Form. Please try again.');
    } finally {
      setLoading(false);
    }
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
              {uploadedImage && (
                <Box mb={2}>
                  <img src={uploadedImage} alt="Uploaded notes" style={{ maxWidth: '100%' }} />
                </Box>
              )}
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
              {extractedText && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Extracted Text:
                  </Typography>
                  <Typography>{extractedText}</Typography>
                </Box>
              )}
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
                onClick={() => createQuiz()}
                disabled={loading || !extractedText}
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

  const testAIConnections = async () => {
    setLoading(true);
    setError(null);
    const results = {
      vision: false,
      gemini: false,
      dialogflow: false
    };
    
    try {
      // Test Vision API
      await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }]
        })
      }).then(res => {
        results.vision = res.status !== 401; // If not unauthorized, API key is valid
      });

      // Test Gemini API
      await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.REACT_APP_GOOGLE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'test' }] }]
        })
      }).then(res => {
        results.gemini = res.status !== 401;
      });

      // Test Dialogflow API
      await fetch(`https://dialogflow.googleapis.com/v2/projects/${process.env.REACT_APP_DIALOGFLOW_PROJECT_ID}/agent/sessions/test:detectIntent?key=${process.env.REACT_APP_GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryInput: { text: { text: 'test', languageCode: 'en-US' } }
        })
      }).then(res => {
        results.dialogflow = res.status !== 401;
      });

      setError(`AI Connection Status:
Vision API: ${results.vision ? '✅' : '❌'}
Gemini API: ${results.gemini ? '✅' : '❌'}
Dialogflow: ${results.dialogflow ? '✅' : '❌'}`);
    } catch (error) {
      console.error('Error testing AI connections:', error);
      setError('Failed to test AI connections. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Study Companion
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
          {isGoogleApiReady && (
            <Box mt={2}>
              <Button
                variant="outlined"
                onClick={handleExportToGoogleDocs}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                Export to Google Docs
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {quiz.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Practice Quiz
          </Typography>
          {isGoogleApiReady && (
            <Box mb={2}>
              <Button
                variant="outlined"
                onClick={handleCreateGoogleForm}
                disabled={loading}
              >
                Create Google Form Quiz
              </Button>
            </Box>
          )}
          {quiz.map((question, qIndex) => (
            <Box key={qIndex} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                {qIndex + 1}. {question.question}
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedAnswers[qIndex] || ''}
                  onChange={(e) => handleAnswerSelect(qIndex, parseInt(e.target.value))}
                >
                  {question.options.map((option, oIndex) => (
                    <FormControlLabel
                      key={oIndex}
                      value={oIndex}
                      control={<Radio />}
                      label={option}
                      disabled={quizSubmitted}
                      sx={{
                        color: quizSubmitted
                          ? oIndex === question.correctAnswer
                            ? 'success.main'
                            : selectedAnswers[qIndex] === oIndex
                            ? 'error.main'
                            : 'text.primary'
                          : 'text.primary',
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
          
          {!quizSubmitted ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleQuizSubmit}
              disabled={Object.keys(selectedAnswers).length !== quiz.length}
            >
              Submit Quiz
            </Button>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your score: {calculateScore()}%
            </Alert>
          )}
        </Paper>
      )}

      {isGoogleApiReady && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Schedule Study Session
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <DateTimePicker
              label="Start Time"
              value={selectedDate}
              onChange={setSelectedDate}
              renderInput={(props) => <TextField {...props} />}
            />
            <Button
              variant="contained"
              onClick={() => scheduleStudySession(
                'Study Session: ' + summary.substring(0, 50) + '...',
                selectedDate,
                addHours(selectedDate, 1)
              )}
              disabled={loading}
            >
              Schedule Session
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default StudyCompanion;
