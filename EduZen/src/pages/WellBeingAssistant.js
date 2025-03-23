import React, { useState } from 'react';
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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SpaIcon from '@mui/icons-material/Spa';
import TimerIcon from '@mui/icons-material/Timer';

const WellBeingAssistant = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingCount, setBreathingCount] = useState(0);

  const handleMessageSend = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { text: message, sender: 'user', timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);

    // TODO: Implement Dialogflow chat processing
    // For now, we'll add a simple response
    const assistantMessage = {
      text: "I understand you're feeling stressed. Would you like to try a quick breathing exercise?",
      sender: 'assistant',
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, assistantMessage]);
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
        </Box>
      </Box>
    </Container>
  );
};

export default WellBeingAssistant;
