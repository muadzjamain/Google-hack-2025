import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  LinearProgress,
  Avatar,
  Fade,
  Tooltip,
  Divider,
  useTheme,
  Slider,
  Snackbar,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SpaIcon from '@mui/icons-material/Spa';
import TimerIcon from '@mui/icons-material/Timer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid';
import { getGeminiResponse } from '../services/gemini';
import { analyzeSentiment } from '../services/sentiment';
import { scheduleBreak } from '../services/google';
import { addMinutes } from 'date-fns';

const WellBeingAssistant = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingCount, setBreathingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [breakDuration, setBreakDuration] = useState(15);
  const [showBreakSlider, setShowBreakSlider] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const chatEndRef = useRef(null);
  const breakSliderRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    setIsBreathing(false);
    setBreathingCount(0);
  }, []);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    // Only auto-scroll if the user is not viewing the break slider
    if (!showBreakSlider) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, showBreakSlider]);

  const handleMessageSend = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    setMessage(''); // Clear input immediately

    try {
      setError(null);
      setLoading(true);

      // Add user message to chat
      const userMessage = { 
        id: uuidv4(),
        message: currentMessage, 
        sender: 'user', 
        timestamp: new Date() 
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Get response from Gemini
      console.log('Sending message to Gemini:', currentMessage); // Debug log
      const response = await getGeminiResponse(currentMessage);
      console.log('Received response from Gemini:', response); // Debug log
      
      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response format from Gemini');
      }

      // Add assistant's response to chat
      const assistantMessage = { 
        id: uuidv4(),
        message: response, 
        sender: 'assistant', 
        timestamp: new Date() 
      };
      setChatHistory(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error in handleMessageSend:', {
        error,
        message: error.message,
        stack: error.stack
      });
      
      setError('Failed to get response. Please try again.');
      
      // Add error message to chat
      const errorMessage = { 
        id: uuidv4(),
        message: `Sorry, I encountered an error: ${error.message}`, 
        sender: 'assistant', 
        timestamp: new Date(),
        isError: true 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startBreathingExercise = () => {
    setIsBreathing(true);
    setBreathingCount(0);
    const interval = setInterval(() => {
      setBreathingCount(count => {
        if (count >= 10) {
          clearInterval(interval);
          setIsBreathing(false);
          return 0;
        }
        return count + 1;
      });
    }, 5000); // 5 seconds per breath
    
    // Store the interval ID so we can clear it if canceled
    window.breathingInterval = interval;
  };
  
  const cancelBreathingExercise = () => {
    if (window.breathingInterval) {
      clearInterval(window.breathingInterval);
    }
    setIsBreathing(false);
    setBreathingCount(0);
  };

  const handleBreakScheduling = async () => {
    try {
      setLoading(true);
      const startTime = new Date();
      const endTime = addMinutes(startTime, breakDuration);
      
      const result = await scheduleBreak(
        `Wellness Break (${breakDuration} min)`, 
        startTime, 
        endTime,
        'Take time to relax and recharge.'
      );
      
      if (result.success) {
        setChatHistory(prev => [
          ...prev,
          {
            id: uuidv4(),
            sender: 'assistant',
            message: `I've scheduled a ${breakDuration}-minute break for you starting now. You'll receive a notification when it's time to get back to studying.`,
            timestamp: new Date()
          }
        ]);
        
        setSnackbarMessage('Break scheduled successfully!');
        setShowSnackbar(true);
      } else {
        // Handle case where Google Calendar API is not available
        setChatHistory(prev => [
          ...prev,
          {
            id: uuidv4(),
            sender: 'assistant',
            message: `I recommend taking a ${breakDuration}-minute break starting now. Google Calendar integration is not available, but I'll still help you track your break time.`,
            timestamp: new Date()
          }
        ]);
        
        setSnackbarMessage('Break timer started (without Calendar integration)');
        setShowSnackbar(true);
        
        // Set a local timer for the break
        setTimeout(() => {
          setChatHistory(prev => [
            ...prev,
            {
              id: uuidv4(),
              sender: 'assistant',
              message: `Your ${breakDuration}-minute break is now over. Ready to get back to studying?`,
              timestamp: new Date()
            }
          ]);
        }, breakDuration * 60 * 1000);
      }
      
      setShowBreakSlider(false);
    } catch (error) {
      console.error('Error scheduling break:', error);
      setChatHistory(prev => [
        ...prev,
        {
          id: uuidv4(),
          sender: 'assistant',
          message: `I encountered an error scheduling your break. Let's try a different approach for your wellness.`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBreakSlider = () => {
    setShowBreakSlider(!showBreakSlider);
    
    // If opening the slider, scroll to it after a short delay to allow for render
    if (!showBreakSlider) {
      setTimeout(() => {
        breakSliderRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const handleSliderChange = (event, newValue) => {
    setBreakDuration(newValue);
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            mb: 3
          }}
        >
          <SpaIcon sx={{ mr: 1, fontSize: 32 }} /> Well-Being Assistant
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Chat history */}
        <Box 
          sx={{ 
            mb: 3, 
            height: '450px', 
            overflowY: 'auto',
            p: 1,
            borderRadius: 1,
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
            },
          }}
        >
          <List>
            {chatHistory.map((chat) => (
              <Fade in={true} key={chat.id} timeout={500}>
                <ListItem
                  sx={{
                    justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                    alignItems: 'flex-start'
                  }}
                >
                  {chat.sender === 'assistant' && (
                    <Avatar 
                      sx={{ 
                        mr: 1, 
                        bgcolor: chat.isError ? 'error.main' : 'primary.main',
                        width: 36,
                        height: 36
                      }}
                    >
                      <SmartToyIcon fontSize="small" />
                    </Avatar>
                  )}
                  
                  <Card
                    sx={{
                      maxWidth: '75%',
                      bgcolor: chat.sender === 'user' 
                        ? theme.palette.primary.main 
                        : chat.isError 
                          ? theme.palette.error.light 
                          : '#ffffff',
                      color: chat.sender === 'user' ? 'white' : chat.isError ? 'white' : 'text.primary',
                      borderRadius: chat.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{chat.message}</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 1,
                          color: chat.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                          textAlign: 'right'
                        }}
                      >
                        {new Date(chat.timestamp).toLocaleTimeString()}
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  {chat.sender === 'user' && (
                    <Avatar 
                      sx={{ 
                        ml: 1, 
                        bgcolor: 'secondary.main',
                        width: 36,
                        height: 36
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </Avatar>
                  )}
                </ListItem>
              </Fade>
            ))}
            <div ref={chatEndRef} />
          </List>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <LinearProgress sx={{ width: '50%', borderRadius: 1 }} />
            </Box>
          )}
          
          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
          
          {isBreathing && (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                my: 2,
                p: 3,
                bgcolor: 'primary.light',
                borderRadius: 2,
                color: 'white',
                position: 'relative'
              }}
            >
              <IconButton
                aria-label="close breathing exercise"
                onClick={cancelBreathingExercise}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
              
              <Typography variant="h6" gutterBottom>
                Breathing Exercise
              </Typography>
              <Box 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: breathingCount % 2 === 0 
                    ? 'breatheIn 5s infinite' 
                    : 'breatheOut 5s infinite',
                  '@keyframes breatheIn': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.3)' },
                    '100%': { transform: 'scale(1)' }
                  },
                  '@keyframes breatheOut': {
                    '0%': { transform: 'scale(1.3)' },
                    '50%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1.3)' }
                  }
                }}
              >
                <Typography variant="h4" color="primary.main">
                  {breathingCount % 2 === 0 ? 'In' : 'Out'}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Breath {Math.floor(breathingCount / 2) + 1} of 5
              </Typography>
            </Box>
          )}
        </Box>

        {/* Message input */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1,
            bgcolor: 'rgba(0, 0, 0, 0.03)',
            p: 1,
            borderRadius: 3
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleMessageSend()}
            disabled={loading}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#ffffff',
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2
                }
              }
            }}
          />
          <Tooltip title="Send message">
            <span>
              <IconButton 
                color="primary" 
                onClick={handleMessageSend}
                disabled={loading || !message.trim()}
                sx={{ 
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
        <Tooltip title="Take a moment to breathe and relax">
          <Button
            variant="contained"
            startIcon={<SpaIcon />}
            onClick={startBreathingExercise}
            disabled={isBreathing}
            sx={{ 
              borderRadius: 3,
              py: 1.5,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              bgcolor: theme.palette.secondary.main,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark
              }
            }}
          >
            Start Breathing Exercise
          </Button>
        </Tooltip>
        <Tooltip title="Schedule a break in your calendar">
          <Button
            variant="contained"
            startIcon={<TimerIcon />}
            onClick={toggleBreakSlider}
            sx={{ 
              borderRadius: 3,
              py: 1.5,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark
              }
            }}
          >
            Schedule Break
          </Button>
        </Tooltip>
      </Box>

      {showBreakSlider && (
        <Card 
          ref={breakSliderRef}
          sx={{ mt: 3, p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
        >
          <Typography variant="h6" gutterBottom>
            Select Break Duration
          </Typography>
          <Box sx={{ px: 2, py: 3 }}>
            <Slider
              value={breakDuration}
              onChange={handleSliderChange}
              min={5}
              max={60}
              step={5}
              marks={[
                { value: 5, label: '5m' },
                { value: 15, label: '15m' },
                { value: 25, label: '25m' },
                { value: 40, label: '40m' },
                { value: 60, label: '1h' },
              ]}
              valueLabelDisplay="on"
              sx={{
                color: theme.palette.primary.main,
                '& .MuiSlider-thumb': {
                  height: 24,
                  width: 24,
                  backgroundColor: theme.palette.primary.main,
                },
                '& .MuiSlider-rail': {
                  opacity: 0.5,
                  backgroundColor: '#bfbfbf',
                },
                '& .MuiSlider-mark': {
                  backgroundColor: '#bfbfbf',
                  height: 8,
                  width: 1,
                  marginTop: -3,
                },
                '& .MuiSlider-markActive': {
                  opacity: 1,
                  backgroundColor: 'currentColor',
                },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleBreakScheduling}
              disabled={loading}
              sx={{ 
                borderRadius: 3,
                py: 1.5,
                px: 4
              }}
            >
              {loading ? 'Scheduling...' : `Schedule ${breakDuration}-minute Break`}
            </Button>
          </Box>
        </Card>
      )}

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WellBeingAssistant;
