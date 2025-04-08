import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initializeGoogleServices } from './services/googleAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StudyCompanion from './pages/StudyCompanion';
import WellBeingAssistant from './pages/WellBeingAssistant';
import VisionTest from './components/VisionTest';

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
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<StudyCompanion />} />
        <Route path="/wellbeing" element={<WellBeingAssistant />} />
        <Route path="/vision-test" element={<VisionTest />} />
      </Routes>
    </>
  );
}

export default App;
