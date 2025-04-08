import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Tooltip,
  Fade,
  Tabs,
  Tab,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { extractTextFromImage } from '../services/vision';
import { summarizeText, generateQuiz } from '../services/gemini';
import { exportToGoogleDocs, createGoogleForm, initGoogleApi } from '../services/google';
import { addHours } from 'date-fns';
import BreakScheduler from '../components/BreakScheduler';

const StudyCompanion = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or null
  const [fileUrl, setFileUrl] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGoogleApiReady, setIsGoogleApiReady] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize Google API and test AI connections
    initGoogleApi()
      .then(() => {
        setIsGoogleApiReady(true);
        testAIConnections(); // Run the test when component mounts
      })
      .catch(console.error);
  }, []);

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const steps = ['Upload Content', 'Extract Text', 'Generate Summary', 'Create Quiz'];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = async (event) => {
    try {
      setLoading(true);
      setError(null);
      const file = event.target.files[0];
      
      if (!file) return;

      // Only accept image files for now
      const isImage = file.type.startsWith('image/');
      
      if (!isImage) {
        setError('Please upload an image file.');
        setLoading(false);
        return;
      }

      setFileType('image');
      setUploadedFile(file);

      // Create a URL for preview
      const fileObjectUrl = URL.createObjectURL(file);
      setFileUrl(fileObjectUrl);
      
      // Move to extraction step to show progress
      setActiveStep(1);
      setExtractedText("Extracting text from your image...");

      // Upload to Firebase Storage
      const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Extract text from image
      try {
        const text = await extractTextFromImage(file);
        if (!text || text.trim() === '') {
          setExtractedText("No text could be extracted from this image. Please try with a clearer image or different content.");
          setError("No text detected in the image. Please try with a clearer image.");
          setLoading(false);
          return;
        }
        setExtractedText(text);
      } catch (error) {
        console.error('Error extracting text:', error);
        setError('Failed to extract text from image. Please try with a clearer image.');
        setLoading(false);
        return;
      }

      // Move to summary step
      setActiveStep(2);

      // Start summary and quiz generation in parallel
      try {
        const [generatedSummary, generatedQuiz] = await Promise.all([
          summarizeText(extractedText),
          generateQuiz(extractedText)
        ]);

        setSummary(generatedSummary);
        setQuiz(generatedQuiz);
        setActiveStep(3);
      } catch (error) {
        console.error('Error generating summary or quiz:', error);
        setError('Failed to generate summary or quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check permissions.');
      setCameraOpen(false);
    }
  };

  const takePicture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      try {
        setLoading(true);
        setError(null);
        
        // Create a file from the blob
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setFileType('image');
        setUploadedFile(file);

        // Create a URL for preview
        const fileObjectUrl = URL.createObjectURL(file);
        setFileUrl(fileObjectUrl);

        // Upload to Firebase Storage
        const storageRef = ref(storage, `notes/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        // Extract text
        const text = await extractTextFromImage(file);
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
        console.error('Error processing camera image:', error);
        setError('Failed to process camera image. Please try again.');
      } finally {
        setLoading(false);
        // Close camera dialog and stop camera stream
        closeCameraDialog();
      }
    }, 'image/jpeg', 0.95);
  };

  const closeCameraDialog = () => {
    setCameraOpen(false);
    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
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
        fileUrl: fileUrl,
        fileType: fileType,
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
          <Box sx={{ width: '100%', mt: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h5" gutterBottom align="center" color="primary">
                Upload Study Material
              </Typography>
              
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                centered 
                sx={{ mb: 3 }}
                indicatorColor="primary"
              >
                <Tab icon={<ImageIcon />} label="Image" />
                <Tab icon={<CameraAltIcon />} label="Camera" />
              </Tabs>
              
              {activeTab === 0 && (
                <Box textAlign="center" p={3}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      size="large"
                      sx={{ 
                        py: 1.5, 
                        px: 4,
                        borderRadius: '20px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Upload Image
                    </Button>
                  </label>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Upload images of your notes, textbooks, or study materials
                  </Typography>
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box textAlign="center" p={3}>
                  <Button
                    variant="contained"
                    onClick={handleCameraCapture}
                    startIcon={<CameraAltIcon />}
                    size="large"
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      borderRadius: '20px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Capture with Camera
                  </Button>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Take a picture of your notes or textbook using your device's camera
                  </Typography>
                </Box>
              )}
              
              {fileUrl && (
                <Box mt={3} textAlign="center">
                  <Typography variant="subtitle1" gutterBottom>
                    Preview:
                  </Typography>
                  <Box sx={{ mt: 2, position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={fileUrl} 
                      alt="Uploaded content" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <IconButton 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        top: 5, 
                        right: 5, 
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                      }}
                      onClick={() => {
                        setFileUrl(null);
                        setUploadedFile(null);
                        setFileType(null);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              )}
              
              {fileUrl && (
                <Box mt={3} textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setActiveStep(1)}
                    disabled={loading}
                    sx={{ 
                      py: 1.2, 
                      px: 4,
                      borderRadius: '20px'
                    }}
                  >
                    Process Image
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        );
      case 1:
        return (
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Extracting Text...
              </Typography>
              {fileUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img 
                    src={fileUrl} 
                    alt="Uploaded content" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      borderRadius: '8px'
                    }} 
                  />
                </Box>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  This may take 10-20 seconds depending on the image complexity...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Summary
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mt: 2 }}>
                <Typography variant="body1">{summary || 'Generating summary...'}</Typography>
              </Paper>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Extracted Text
                </Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, maxHeight: '200px', overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {extractedText}
                  </Typography>
                </Paper>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleExportToGoogleDocs}
                  disabled={!isGoogleApiReady || loading || !summary}
                  sx={{ borderRadius: '20px' }}
                >
                  Export to Google Docs
                </Button>
                <Button
                  variant="contained"
                  onClick={() => createQuiz(extractedText)}
                  disabled={loading || !extractedText}
                  sx={{ borderRadius: '20px' }}
                >
                  Generate Quiz
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Study Quiz
              </Typography>
              
              {quiz.length > 0 ? (
                <>
                  {quiz.map((question, qIndex) => (
                    <Card key={qIndex} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {qIndex + 1}. {question.question}
                      </Typography>
                      <FormControl component="fieldset" sx={{ ml: 2 }}>
                        <RadioGroup>
                          {question.options.map((option, oIndex) => (
                            <FormControlLabel
                              key={oIndex}
                              value={oIndex.toString()}
                              control={
                                <Radio 
                                  checked={selectedAnswers[qIndex] === oIndex}
                                  onChange={() => handleAnswerSelect(qIndex, oIndex)}
                                  disabled={quizSubmitted}
                                />
                              }
                              label={option}
                              sx={{
                                ...(quizSubmitted && oIndex === question.correctAnswer && {
                                  color: 'success.main',
                                  fontWeight: 'bold',
                                }),
                                ...(quizSubmitted && 
                                  selectedAnswers[qIndex] === oIndex && 
                                  oIndex !== question.correctAnswer && {
                                    color: 'error.main',
                                  }),
                              }}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Card>
                  ))}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                    {!quizSubmitted ? (
                      <Button
                        variant="contained"
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(selectedAnswers).length !== quiz.length}
                        sx={{ borderRadius: '20px' }}
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <>
                        <Typography variant="h6" color={calculateScore() >= 70 ? 'success.main' : 'error.main'}>
                          Your Score: {calculateScore().toFixed(0)}%
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={handleCreateGoogleForm}
                          disabled={!isGoogleApiReady || loading}
                          sx={{ ml: 2, borderRadius: '20px' }}
                        >
                          Export to Google Forms
                        </Button>
                      </>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Test AI connections
  const testAIConnections = async () => {
    const results = {
      vision: false,
      gemini: false,
    };
    
    try {
      // Test Vision API
      await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ 
            image: { content: '' },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }).then(res => {
        results.vision = res.status !== 401;
      });

      // Test Gemini API
      await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash?key=${process.env.REACT_APP_GOOGLE_GEMINI_API_KEY}`).then(res => {
        results.gemini = res.status !== 401;
      });

      setError(`AI Connection Status:
Vision API: ${results.vision ? '✅' : '❌'}
Gemini API: ${results.gemini ? '✅' : '❌'}`);
    } catch (error) {
      console.error('Error testing AI connections:', error);
      setError('Failed to test AI connections. Check console for details.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
          <SchoolIcon sx={{ mr: 1, fontSize: 32 }} />
          AI Study Companion
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary', mb: 4 }}>
          Upload your study materials or capture images with your camera. 
          Our AI will extract the text, generate a summary, and create a quiz to help you study.
        </Typography>
        
        {error && (
          <Alert severity={error.includes('✅') ? 'info' : 'error'} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {loading && activeStep !== 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {renderStepContent(activeStep)}
      </Paper>
      
      {/* Break Scheduler Section */}
      <Box sx={{ mt: 4 }}>
        <BreakScheduler />
      </Box>
      
      {/* Camera Dialog */}
      <Dialog 
        open={cameraOpen} 
        onClose={closeCameraDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Capture Image</Typography>
            <IconButton onClick={closeCameraDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', textAlign: 'center' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              style={{ 
                width: '100%', 
                maxHeight: '70vh',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }} 
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCameraDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={takePicture}
            startIcon={<CameraAltIcon />}
            sx={{ borderRadius: '20px' }}
          >
            Take Picture
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudyCompanion;
