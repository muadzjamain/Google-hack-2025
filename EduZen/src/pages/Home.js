import React from 'react';
import { Container, Typography, Grid, Paper, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import SpaIcon from '@mui/icons-material/Spa';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to EduZen
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Your AI-powered study companion and well-being assistant
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' }
            }}
            onClick={() => navigate('/study')}
          >
            <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Study Companion
            </Typography>
            <Typography color="textSecondary" paragraph align="center">
              Upload notes, get AI-powered summaries, and generate quizzes to enhance your learning
            </Typography>
            <Button variant="contained" color="primary" size="large">
              Start Learning
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' }
            }}
            onClick={() => navigate('/wellbeing')}
          >
            <SpaIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Well-Being Assistant
            </Typography>
            <Typography color="textSecondary" paragraph align="center">
              Get emotional support, stress management tips, and maintain study-life balance
            </Typography>
            <Button variant="contained" color="secondary" size="large">
              Start Wellness Journey
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;
