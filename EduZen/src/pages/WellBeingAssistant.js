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
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SpaIcon from '@mui/icons-material/Spa';
import TimerIcon from '@mui/icons-material/Timer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { v4 as uuidv4 } from 'uuid';
import { getGeminiResponse } from '../services/gemini';
import { analyzeSentiment } from '../services/sentiment';
import { scheduleStudySession } from '../services/google';
import { addMinutes } from 'date-fns';

const WellBeingAssistant = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingCount, setBreathingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    setIsBreathing(false);
    setBreathingCount(0);
  }, []);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

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
        text: currentMessage, 
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
        text: response, 
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
        text: `Sorry, I encountered an error: ${error.message}`, 
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
  };

  const handleBreakScheduling = async () => {
    try {
      await scheduleStudySession(new Date(), addMinutes(new Date(), 15));
      const message = {
        id: uuidv4(),
        text: 'Break scheduled successfully! I\'ve added a 15-minute break to your calendar.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, message]);
    } catch (error) {
      console.error('Failed to schedule break:', error);
      setError('Failed to schedule break');
    }
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
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{chat.text}</Typography>
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
                color: 'white'
              }}
            >
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
        <Tooltip title="Schedule a 15-minute break in your calendar">
          <Button
            variant="contained"
            startIcon={<TimerIcon />}
            onClick={handleBreakScheduling}
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
    </Container>
  );
};

export default WellBeingAssistant;
