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
    // Initialize Google API
    initGoogleApi()
      .then(() => setIsGoogleApiReady(true))
      .catch(console.error);
  }, []);

  const steps = ['Upload Notes', 'Extract Text', 'Generate Summary', 'Create Quiz'];

  const handleImageUpload = async (event) => {
    try {
      setLoading(true);
      setError(null);
      const file = event.target.files[0];
      const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      setUploadedImage(imageUrl);
      setActiveStep(1);
      
      // Automatically start text extraction
      await extractText(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractText = async (imageUrl) => {
    try {
      setLoading(true);
      setError(null);
      const text = await extractTextFromImage(imageUrl || uploadedImage);
      setExtractedText(text);
      setActiveStep(2);
      
      // Automatically start summary generation
      await generateSummary(text);
    } catch (error) {
      console.error('Error extracting text:', error);
      setError('Failed to extract text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (text) => {
    try {
      setLoading(true);
      setError(null);
      const generatedSummary = await summarizeText(text || extractedText);
      setSummary(generatedSummary);
      setActiveStep(3);
      
      // Automatically start quiz generation
      await createQuiz(text || extractedText);
    } catch (error) {
      console.error('Error generating summary:', error);
      setError('Failed to generate summary. Please try again.');
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
              <Button
                variant="contained"
                onClick={() => extractText()}
                disabled={loading || !uploadedImage}
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
              {extractedText && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Extracted Text:
                  </Typography>
                  <Typography>{extractedText}</Typography>
                </Box>
              )}
              <Button
                variant="contained"
                onClick={() => generateSummary()}
                disabled={loading || !extractedText}
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
