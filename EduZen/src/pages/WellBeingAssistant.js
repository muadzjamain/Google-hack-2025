import React, { useState, useEffect } from 'react';
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
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SpaIcon from '@mui/icons-material/Spa';
import TimerIcon from '@mui/icons-material/Timer';
import { v4 as uuidv4 } from 'uuid';
import { detectIntent } from '../services/dialogflow';
import { analyzeSentiment } from '../services/sentiment';
import { scheduleStudySession } from '../services/google';
import { DateTimePicker } from '@mui/lab';
import { addMinutes } from 'date-fns';

const WellBeingAssistant = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingCount, setBreathingCount] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stressLevel, setStressLevel] = useState(null);
  const [showBreakPlanner, setShowBreakPlanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create a unique session ID for this chat session
    setSessionId(uuidv4());
  }, []);

  const handleMessageSend = async () => {
    if (!message.trim()) return;

    try {
      setError(null);
      // Analyze sentiment first
      const sentiment = await analyzeSentiment(message);
      setStressLevel(sentiment.score);

      // Add user message to chat
      const userMessage = { text: message, sender: 'user', timestamp: new Date() };
      setChatHistory(prev => [...prev, userMessage]);

      // Get response from Dialogflow
      const response = await detectIntent(message, sessionId);
      
      // Add assistant's response to chat
      const assistantMessage = {
        text: response.text,
        sender: 'assistant',
        timestamp: new Date(),
        intent: response.intent
      };
      setChatHistory(prev => [...prev, assistantMessage]);

      // Handle specific intents and stress levels
      if (sentiment.isStressed || response.intent === 'Stress_Management') {
        startBreathingExercise();
      }

      if (sentiment.isStressed && !showBreakPlanner) {
        setShowBreakPlanner(true);
        const breakMessage = {
          text: "I notice you might be feeling stressed. Would you like to schedule a break? I can help you plan some rest time.",
          sender: 'assistant',
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, breakMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        text: "I'm having trouble processing your message. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }

    setMessage('');
  };

  const startBreathingExercise = () => {
    setIsBreathing(true);
    setBreathingCount(0);
    
    const interval = setInterval(() => {
      setBreathingCount(prev => {
        if (prev >= 10) {
          clearInterval(interval);
          setIsBreathing(false);
          return 0;
        }
        return prev + 1;
      });
    }, 5000); // 5 seconds per breath
  };

  const scheduleBreak = async () => {
    try {
      setLoading(true);
      const event = await scheduleStudySession(
        'Scheduled Break - Rest & Recharge',
        selectedDate,
        addMinutes(selectedDate, 15)
      );
      
      const confirmMessage = {
        text: `I've scheduled a 15-minute break for you at ${selectedDate.toLocaleTimeString()}. Remember to take care of yourself!`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, confirmMessage]);
      setShowBreakPlanner(false);
    } catch (error) {
      console.error('Error scheduling break:', error);
      setError('Failed to schedule break. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Well-Being Assistant
      </Typography>

      <Box display="flex" gap={3}>
        <Box flex={2}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ height: '60vh', overflowY: 'auto', mb: 2 }}>
              <List>
                {chatHistory.map((msg, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          bgcolor: msg.sender === 'user' ? 'primary.light' : 'secondary.light',
                        }}
                      >
                        <ListItemText
                          primary={msg.text}
                          secondary={msg.timestamp.toLocaleTimeString()}
                        />
                      </Paper>
                    </ListItem>
                    {index < chatHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>

            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleMessageSend()}
              />
              <IconButton
                color="primary"
                onClick={handleMessageSend}
                disabled={!message.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>

        <Box flex={1}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Breathing Exercise
              </Typography>
              {isBreathing ? (
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {breathingCount % 2 === 0 ? 'Inhale...' : 'Exhale...'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Breath {Math.ceil(breathingCount / 2)} of 5
                  </Typography>
                </Box>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  startIcon={<SpaIcon />}
                  onClick={startBreathingExercise}
                >
                  Start Breathing Exercise
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Study Timer
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<TimerIcon />}
              >
                Start Pomodoro Timer
              </Button>
            </CardContent>
          </Card>

          {showBreakPlanner && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Schedule a Break
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <DateTimePicker
                    label="Break Time"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    renderInput={(props) => <TextField {...props} />}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={scheduleBreak}
                    disabled={loading}
                  >
                    Schedule 15min Break
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {stressLevel !== null && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stress Level
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box flex={1}>
                    <LinearProgress
                      variant="determinate"
                      value={(stressLevel + 1) * 50}
                      color={stressLevel < -0.3 ? "error" : "success"}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {stressLevel < -0.3 ? "High" : stressLevel < 0 ? "Moderate" : "Low"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default WellBeingAssistant;
