import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import SpaIcon from '@mui/icons-material/Spa';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          EduZen
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={Link}
            to="/study"
            startIcon={<SchoolIcon />}
          >
            Study Companion
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/wellbeing"
            startIcon={<SpaIcon />}
          >
            Well-Being
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
