import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton, 
  Tooltip, 
  Divider, 
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import SpaIcon from '@mui/icons-material/Spa';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import { checkGoogleAuthStatus, signInWithGoogle, signOutFromGoogle } from '../services/googleAuth';

const Navbar = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        if (window.gapi && window.gapi.auth2) {
          const isAuthenticated = checkGoogleAuthStatus();
          setIsSignedIn(isAuthenticated);
          
          if (isAuthenticated) {
            const googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
            const profile = googleUser.getBasicProfile();
            setUserProfile({
              id: profile.getId(),
              name: profile.getName(),
              email: profile.getEmail(),
              imageUrl: profile.getImageUrl()
            });
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };
    
    checkAuthStatus();
    
    // Set up auth change listener
    if (window.gapi && window.gapi.auth2) {
      window.gapi.auth2.getAuthInstance().isSignedIn.listen((signedIn) => {
        setIsSignedIn(signedIn);
        checkAuthStatus();
      });
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const user = await signInWithGoogle();
      const profile = user.getBasicProfile();
      setUserProfile({
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        imageUrl: profile.getImageUrl()
      });
      setIsSignedIn(true);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOutFromGoogle();
      setUserProfile(null);
      setIsSignedIn(false);
      setAnchorEl(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Study Companion', icon: <SchoolIcon />, path: '/study-companion' },
    { text: 'Well-Being', icon: <SpaIcon />, path: '/well-being-assistant' }
  ];

  const renderMobileDrawer = () => (
    <>
      <IconButton 
        edge="start" 
        color="inherit" 
        aria-label="menu" 
        onClick={toggleMobileMenu}
        sx={{ mr: 1 }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleMobileMenu}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="primary">
              EduZen
            </Typography>
          </Box>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                component={Link} 
                to={item.path}
                selected={isActive(item.path)}
                sx={{
                  bgcolor: isActive(item.path) ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(66, 133, 244, 0.1)',
                  },
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    fontWeight: isActive(item.path) ? 'medium' : 'regular'
                  }} 
                />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            {isSignedIn ? (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Out'}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleLogin}
                startIcon={<LoginIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In with Google'}
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        bgcolor: 'white', 
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && renderMobileDrawer()}
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              textDecoration: 'none', 
              color: 'primary.main',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            EduZen
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', mx: 'auto' }}>
            {navItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{ 
                  mx: 1,
                  color: isActive(item.path) ? 'primary.main' : 'text.primary',
                  fontWeight: isActive(item.path) ? 'medium' : 'regular',
                  '&:hover': {
                    bgcolor: 'rgba(66, 133, 244, 0.1)',
                  },
                  bgcolor: isActive(item.path) ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
                  borderRadius: '20px',
                  px: 2
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        )}

        <Box>
          {isSignedIn ? (
            <>
              <Tooltip title={userProfile?.name || 'Account'}>
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                >
                  {userProfile?.imageUrl ? (
                    <Avatar 
                      src={userProfile.imageUrl} 
                      alt={userProfile.name}
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {userProfile?.name?.charAt(0) || 'U'}
                    </Avatar>
                  )}
                </IconButton>
              </Tooltip>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 2,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    borderRadius: 2,
                    minWidth: 180,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {userProfile?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userProfile?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body1">Sign out</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              startIcon={<LoginIcon />}
              disabled={loading}
              sx={{ 
                borderRadius: '20px',
                px: 2,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
