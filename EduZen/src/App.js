import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeGoogleServices } from './services/googleAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StudyCompanion from './pages/StudyCompanion';
import WellBeingAssistant from './pages/WellBeingAssistant';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  useEffect(() => {
    const initServices = async () => {
      try {
        await initializeGoogleServices();
      } catch (error) {
        console.error('Failed to initialize Google services:', error);
      }
    };
    initServices();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<StudyCompanion />} />
          <Route path="/wellbeing" element={<WellBeingAssistant />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
