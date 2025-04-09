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
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SummarizeIcon from '@mui/icons-material/Summarize';
import QuizIcon from '@mui/icons-material/Quiz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { 
  analyzeImageWithGemini, 
  summarizeText, 
  generateQuiz, 
  formatText, 
  summarizePDFWithGemini, 
  generatePDFQuiz,
  analyzePDFWithGemini,
  generatePDFStudyPlan
} from '../services/gemini';
import { extractTextFromPDF, getPDFMetadata } from '../services/pdfExtractor';
import { checkGoogleAuthStatus } from '../services/googleAuth';
import StudyPlanGenerator from '../components/StudyPlanGenerator';

const StudyCompanion = () => {
  // Main state for the workflow
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Content upload states
  const [uploadType, setUploadType] = useState('image'); // 'image', 'camera', 'pdf'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  
  // Content analysis states
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Quiz states
  const [quiz, setQuiz] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Format text by removing ** markers
  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  };

  // Initialize Google API
  useEffect(() => {
    const initializeGoogleApi = async () => {
      try {
        // await initGoogleApi();
        // setIsGoogleApiReady(true);
        
        // Check if user is signed in
        const signedIn = await checkGoogleAuthStatus();
        // setIsGoogleSignedIn(signedIn);
      } catch (error) {
        console.error('Error initializing Google API:', error);
        // Don't block the app if Google API fails
        setError('Google API initialization failed. Some features may be limited.');
      }
    };
    
    // Try to initialize Google API but don't block the app functionality
    initializeGoogleApi().catch(err => {
      console.error('Failed to initialize Google API:', err);
      // We'll still allow the app to function without Google API
    });
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

  // Tab handling
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // File upload handlers
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    
    setUploadType('image');
    setUploadedFile(file);
    setFileUrl(URL.createObjectURL(file));
    setSuccess('Image uploaded successfully! Click "Analyze Content" to proceed.');
  };
  
  const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    
    setUploadType('pdf');
    setUploadedFile(file);
    setFileUrl(URL.createObjectURL(file));
    setSuccess('PDF uploaded successfully! Click "Analyze Content" to proceed.');
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
        // Create a file from the blob
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        setUploadType('image');
        setUploadedFile(file);
        setFileUrl(URL.createObjectURL(file));
        setSuccess('Image captured successfully! Click "Analyze Content" to proceed.');
        
        // Close camera dialog
        closeCameraDialog();
      } catch (error) {
        console.error('Error processing camera image:', error);
        setError('Failed to process camera image. Please try again.');
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
  
  // Content analysis
  const analyzeContent = async () => {
    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }
    
    try {
      setLoading(true);
      setIsAnalyzing(true);
      setError(null);
      
      // Get download URL from Firebase Storage
      let downloadUrl = '';
      try {
        setStatusMessage('Uploading to secure storage...');
        const storageRef = ref(storage, `study_materials/${Date.now()}_${uploadedFile.name}`);
        const snapshot = await uploadBytes(storageRef, uploadedFile);
        downloadUrl = await getDownloadURL(snapshot.ref);
        console.log('Uploaded file to Firebase Storage:', snapshot);
        console.log('Download URL:', downloadUrl);
      } catch (error) {
        console.error('Error uploading to Firebase Storage:', error);
        // Continue with local file handling if Firebase upload fails
      }
      
      // Analyze content based on file type
      let text = '';
      
      if (uploadType === 'image') {
        // Analyze image with Gemini
        setStatusMessage('Analyzing image content...');
        text = await analyzeImageWithGemini(uploadedFile);
      } else if (uploadType === 'pdf') {
        try {
          // Use Gemini Vision API to analyze the PDF directly
          setStatusMessage('Analyzing PDF with Gemini Vision API...');
          text = await analyzePDFWithGemini(uploadedFile);
          
          // Get PDF metadata for additional context
          const metadata = await getPDFMetadata(uploadedFile);
          console.log('PDF Metadata:', metadata);
          
          if (text.trim().length === 0) {
            text = 'The PDF analysis did not return any content. The file might be empty, corrupted, or contain only images that could not be processed.';
          }
        } catch (error) {
          console.error('Error analyzing PDF with Gemini:', error);
          text = 'Failed to analyze the PDF with Gemini Vision API. The file might be too large, corrupted, or in an unsupported format.';
        }
      }
      
      // Format text to remove ** markers
      text = formatText(text);
      setExtractedText(text);
      
      // Generate summary
      let generatedSummary = '';
      try {
        setStatusMessage('Generating summary...');
        if (uploadType === 'pdf') {
          // For PDFs, the analyzePDFWithGemini already provides a summary
          generatedSummary = text;
        } else {
          generatedSummary = await summarizeText(text);
        }
        generatedSummary = formatText(generatedSummary);
      } catch (error) {
        console.error('Error generating summary:', error);
        generatedSummary = 'Failed to generate summary. Please try again.';
      }
      setSummary(generatedSummary);
      
      // Generate quiz
      let generatedQuiz = [];
      try {
        setStatusMessage('Creating quiz questions...');
        if (uploadType === 'pdf') {
          generatedQuiz = await generatePDFQuiz(text);
        } else {
          generatedQuiz = await generateQuiz(text);
        }
        console.log('Generated quiz questions:', generatedQuiz.length);
      } catch (error) {
        console.error('Error generating quiz:', error);
        // Create a simple fallback quiz if generation fails
        generatedQuiz = [
          {
            question: 'What was the main topic of the content you uploaded?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
          }
        ];
      }
      setQuiz(generatedQuiz);
      
      // Try to save to Firestore, but don't block if it fails
      try {
        setStatusMessage('Saving your study session...');
        if (downloadUrl) {
          const docRef = await addDoc(collection(db, 'studySessions'), {
            timestamp: new Date(),
            fileUrl: downloadUrl,
            fileType: uploadType,
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            extractedText: text,
            summary: generatedSummary,
            quiz: generatedQuiz,
          });
          console.log('Document written with ID:', docRef.id);
        }
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        // Continue even if Firestore save fails
      }
      
      // Show success message and navigate to summary tab
      setSuccess('Content analyzed successfully!');
      setActiveTab(1);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error analyzing content:', error);
      setError('Failed to analyze content. Please try again.');
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
      setStatusMessage('');
    }
  };
  
  // Quiz handling
  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };
  
  const handleQuizSubmit = () => {
    // Calculate score
    let correct = 0;
    quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    
    const score = (correct / quiz.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);
    setSuccess(`Quiz submitted! Your score: ${score.toFixed(2)}%`);
  };
  
  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };
  
  // Render the main UI
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ 
        p: 4, 
        borderRadius: 2, 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ 
          color: '#4285F4', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3
        }}>
          <SchoolIcon sx={{ mr: 1, fontSize: 36 }} />
          AI Study Companion
        </Typography>
        
        <Typography variant="body1" paragraph align="center" sx={{ mb: 4 }}>
          Upload your study materials or capture images with your camera. Our AI will extract the text, generate a summary, and create a quiz to help you study.
        </Typography>
        
        {/* Error and success messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        {statusMessage && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {statusMessage}
          </Alert>
        )}
        
        {/* Main tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="study companion tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                borderRadius: '20px 20px 0 0',
                minHeight: '64px',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: '#4285F4',
                fontWeight: 600,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4285F4',
                height: 3,
              }
            }}
          >
            <Tab 
              icon={<CloudUploadIcon />} 
              label="Upload Content" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<SummarizeIcon />} 
              label="Summary" 
              id="tab-1" 
              aria-controls="tabpanel-1"
              disabled={!summary} 
            />
            <Tab 
              icon={<QuizIcon />} 
              label="Quiz" 
              id="tab-2" 
              aria-controls="tabpanel-2"
              disabled={!quiz.length} 
            />
            <Tab 
              icon={<CalendarMonthIcon />} 
              label="Study Plan" 
              id="tab-3" 
              aria-controls="tabpanel-3"
              disabled={!summary} 
            />
          </Tabs>
        </Box>
        
        {/* Tab panels */}
        <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3} justifyContent="center">
                {/* Upload options */}
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      },
                      border: uploadType === 'image' ? '2px solid #4285F4' : 'none',
                      borderRadius: '20px'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: 'rgba(66, 133, 244, 0.1)', 
                          borderRadius: '50%', 
                          width: 80, 
                          height: 80, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 40, color: '#4285F4' }} />
                      </Box>
                      <Typography variant="h6" component="div" gutterBottom>
                        Upload Image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload an image of your notes, textbook, or other study materials
                      </Typography>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      },
                      borderRadius: '20px'
                    }}
                    onClick={handleCameraCapture}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: 'rgba(52, 168, 83, 0.1)', 
                          borderRadius: '50%', 
                          width: 80, 
                          height: 80, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}
                      >
                        <CameraAltIcon sx={{ fontSize: 40, color: '#34A853' }} />
                      </Box>
                      <Typography variant="h6" component="div" gutterBottom>
                        Capture Image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Take a photo of your notes or textbook using your camera
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      },
                      border: uploadType === 'pdf' ? '2px solid #4285F4' : 'none',
                      borderRadius: '20px'
                    }}
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: 'rgba(234, 67, 53, 0.1)', 
                          borderRadius: '50%', 
                          width: 80, 
                          height: 80, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}
                      >
                        <PictureAsPdfIcon sx={{ fontSize: 40, color: '#EA4335' }} />
                      </Box>
                      <Typography variant="h6" component="div" gutterBottom>
                        Upload PDF
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload a PDF document of your study materials
                      </Typography>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={handlePdfUpload}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Preview and analyze section */}
              {fileUrl && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      mb: 3
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.2)'
                        }
                      }}
                      onClick={() => {
                        setFileUrl(null);
                        setUploadedFile(null);
                        setUploadType(null);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    
                    {uploadType === 'image' && (
                      <img 
                        src={fileUrl} 
                        alt="Uploaded content" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px',
                          borderRadius: '12px'
                        }} 
                      />
                    )}
                    
                    {uploadType === 'pdf' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                        <PictureAsPdfIcon sx={{ fontSize: 60, color: '#EA4335', mr: 2 }} />
                        <Typography variant="h6">
                          {uploadedFile?.name}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={analyzeContent}
                    disabled={loading || !uploadedFile}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SummarizeIcon />}
                    sx={{ 
                      mt: 2, 
                      borderRadius: '20px',
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Content'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
        
        {/* Summary Tab */}
        <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
          {activeTab === 1 && (
            <Box>
              {isAnalyzing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="h6">Generating summary...</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This may take a moment as our AI analyzes your content
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Summary section */}
                  <Card 
                    elevation={2} 
                    sx={{ 
                      mb: 4, 
                      borderRadius: '20px',
                      overflow: 'hidden'
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ 
                        bgcolor: 'rgba(66, 133, 244, 0.1)', 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <SummarizeIcon sx={{ color: '#4285F4', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 500, color: '#4285F4' }}>
                          AI-Generated Summary
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ p: 3 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                          {formatText(summary)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                  
                  {/* Extracted text section */}
                  <Card 
                    elevation={2} 
                    sx={{ 
                      mb: 4, 
                      borderRadius: '20px',
                      overflow: 'hidden'
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ 
                        bgcolor: 'rgba(52, 168, 83, 0.1)', 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center'
                      }}>
                        <FormatListBulletedIcon sx={{ color: '#34A853', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 500, color: '#34A853' }}>
                          Extracted Text
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ p: 3, maxHeight: '300px', overflow: 'auto' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                          {formatText(extractedText)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                  
                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<QuizIcon />}
                      onClick={() => setActiveTab(2)}
                      sx={{ 
                        borderRadius: '20px',
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Take Quiz
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CalendarMonthIcon />}
                      onClick={() => setActiveTab(3)}
                      sx={{ 
                        borderRadius: '20px',
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      Create Study Plan
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
        
        {/* Quiz Tab */}
        <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-2" aria-labelledby="tab-2">
          {activeTab === 2 && (
            <Box>
              {quiz.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="h6">Generating quiz questions...</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                      color: '#4285F4', 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 3
                    }}>
                      <QuizIcon sx={{ mr: 1 }} />
                      Test Your Knowledge
                    </Typography>
                    
                    {quizSubmitted && (
                      <Card sx={{ 
                        mb: 4, 
                        p: 2, 
                        bgcolor: quizScore >= 70 ? 'rgba(52, 168, 83, 0.1)' : 'rgba(234, 67, 53, 0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}>
                        <Typography variant="h4" sx={{ 
                          color: quizScore >= 70 ? '#34A853' : '#EA4335',
                          fontWeight: 'bold',
                          mb: 1
                        }}>
                          {quizScore.toFixed(0)}%
                        </Typography>
                        <Typography variant="body1">
                          {quizScore >= 70 
                            ? 'Great job! You have a good understanding of the material.' 
                            : 'Keep studying! Review the summary to improve your score.'}
                        </Typography>
                      </Card>
                    )}
                    
                    {quiz.map((question, qIndex) => (
                      <Card 
                        key={qIndex} 
                        sx={{ 
                          mb: 3, 
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <CardContent sx={{ p: 0 }}>
                          <Box sx={{ 
                            bgcolor: 'rgba(66, 133, 244, 0.1)', 
                            p: 2
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                              Question {qIndex + 1}
                            </Typography>
                          </Box>
                          <Box sx={{ p: 3 }}>
                            <Typography variant="body1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                              {question.question}
                            </Typography>
                            
                            <FormControl component="fieldset" sx={{ width: '100%' }}>
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
                                        sx={{
                                          '&.Mui-checked': {
                                            color: quizSubmitted 
                                              ? (oIndex === question.correctAnswer ? '#34A853' : '#EA4335')
                                              : '#4285F4'
                                          }
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography 
                                        variant="body1" 
                                        sx={{
                                          ...(quizSubmitted && oIndex === question.correctAnswer && {
                                            color: '#34A853',
                                            fontWeight: 'bold',
                                          }),
                                          ...(quizSubmitted && 
                                            selectedAnswers[qIndex] === oIndex && 
                                            oIndex !== question.correctAnswer && {
                                              color: '#EA4335',
                                              fontWeight: 'bold',
                                            }),
                                        }}
                                      >
                                        {option}
                                      </Typography>
                                    }
                                    sx={{ 
                                      mb: 1,
                                      p: 1,
                                      borderRadius: '12px',
                                      ...(quizSubmitted && oIndex === question.correctAnswer && {
                                        bgcolor: 'rgba(52, 168, 83, 0.1)',
                                      }),
                                      ...(quizSubmitted && 
                                        selectedAnswers[qIndex] === oIndex && 
                                        oIndex !== question.correctAnswer && {
                                          bgcolor: 'rgba(234, 67, 53, 0.1)',
                                        }),
                                    }}
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Quiz action buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                      {!quizSubmitted ? (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleIcon />}
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(selectedAnswers).length !== quiz.length}
                          sx={{ 
                            borderRadius: '20px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem'
                          }}
                        >
                          Submit Answers
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={resetQuiz}
                            sx={{ 
                              borderRadius: '20px',
                              px: 3,
                              py: 1,
                              textTransform: 'none'
                            }}
                          >
                            Try Again
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
        
        {/* Study Plan Tab */}
        <Box role="tabpanel" hidden={activeTab !== 3} id="tabpanel-3" aria-labelledby="tab-3">
          {activeTab === 3 && (
            <Box>
              <StudyPlanGenerator 
                content={extractedText} 
                onClose={() => setActiveTab(1)}
              />
            </Box>
          )}
        </Box>
      </Paper>
      
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
