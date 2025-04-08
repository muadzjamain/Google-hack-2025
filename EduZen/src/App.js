import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StudyCompanion from './pages/StudyCompanion';
import WellBeingAssistant from './pages/WellBeingAssistant';
import theme from './theme/theme';
import { initializeGoogleServices } from './services/googleAuth';

function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initGoogle = async () => {
      try {
        setInitializing(true);
        await initializeGoogleServices();
      } catch (error) {
        console.error('Failed to initialize Google services:', error);
      } finally {
        setInitializing(false);
      }
    };

    initGoogle();
  }, []);

  if (initializing) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress color="primary" />
          <Box sx={{ color: 'text.secondary' }}>
            Initializing EduZen...
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study-companion" element={<StudyCompanion />} />
          <Route path="/well-being-assistant" element={<WellBeingAssistant />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
