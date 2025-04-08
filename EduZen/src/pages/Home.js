import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Button, 
  Box, 
  Card, 
  CardContent, 
  CardActions,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import SpaIcon from '@mui/icons-material/Spa';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { checkGoogleAuthStatus } from '../services/googleAuth';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check authentication status safely
    const authStatus = checkGoogleAuthStatus();
    setIsAuthenticated(authStatus);
  }, []);

  const handleNavigateToStudy = () => {
    navigate('/study-companion');
  };

  const handleNavigateToWellbeing = () => {
    navigate('/well-being-assistant');
  };

  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 6 }, mb: 8 }}>
        <Box 
          textAlign="center" 
          mb={{ xs: 4, md: 8 }}
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            px: 2
          }}
        >
          <Typography 
            variant={isMobile ? "h3" : "h2"} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            Welcome to EduZen
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 4 }}
          >
            Your AI-powered study companion and well-being assistant
          </Typography>
          
          {!isAuthenticated && (
            <Typography 
              variant="body1" 
              sx={{ 
                bgcolor: 'rgba(66, 133, 244, 0.1)', 
                p: 2, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.light',
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Sign in with your Google account to schedule study breaks, save your notes, and get personalized recommendations.
            </Typography>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: '0 16px 70px rgba(0, 0, 0, 0.15)' 
                }
              }}
            >
              <CardContent sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexGrow: 1
              }}>
                <Box 
                  sx={{ 
                    bgcolor: 'rgba(66, 133, 244, 0.1)', 
                    borderRadius: '50%',
                    p: 2,
                    mb: 3
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{ fontWeight: 'medium', mb: 2 }}
                >
                  Study Companion
                </Typography>
                <Typography 
                  color="text.secondary" 
                  paragraph 
                  align="center"
                  sx={{ mb: 3 }}
                >
                  Upload notes, get AI-powered summaries, and generate quizzes to enhance your learning. Schedule study breaks to maintain productivity.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNavigateToStudy}
                  sx={{ 
                    borderRadius: '50px',
                    px: 4
                  }}
                >
                  Start Learning
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: '0 16px 70px rgba(0, 0, 0, 0.15)' 
                }
              }}
            >
              <CardContent sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexGrow: 1
              }}>
                <Box 
                  sx={{ 
                    bgcolor: 'rgba(52, 168, 83, 0.1)', 
                    borderRadius: '50%',
                    p: 2,
                    mb: 3
                  }}
                >
                  <SpaIcon sx={{ fontSize: 60, color: '#34A853' }} />
                </Box>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{ fontWeight: 'medium', mb: 2 }}
                >
                  Well-Being Assistant
                </Typography>
                <Typography 
                  color="text.secondary" 
                  paragraph 
                  align="center"
                  sx={{ mb: 3 }}
                >
                  Get emotional support, stress management tips, and maintain study-life balance. Schedule wellness breaks to stay refreshed.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNavigateToWellbeing}
                  sx={{ 
                    borderRadius: '50px',
                    px: 4,
                    bgcolor: '#34A853',
                    '&:hover': {
                      bgcolor: '#2E9748'
                    }
                  }}
                >
                  Start Wellness Journey
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            EduZen uses Google services for calendar scheduling and document management.
          </Typography>
        </Box>
      </Container>
    </Fade>
  );
};

export default Home;
