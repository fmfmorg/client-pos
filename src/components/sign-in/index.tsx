'use client'

import { FormEvent, useEffect, useRef, useState } from 'react';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';
import { sessionMinutes } from '@misc';

const StyledContainer = styled(Container)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '16px',
    boxSizing: 'border-box',
    width: '400px',
    maxWidth: '100%'
});

const SignInForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClickShowPassword = () => setShowPassword(!showPassword);

    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpenSnackbar(false);
    };

    // const disableFields = (disabled:boolean) => {
    //   (usernameRef.current as HTMLInputElement).disabled = disabled;
    //   (passwordRef.current as HTMLInputElement).disabled = disabled;
    //   setLoading(disabled);
    // }

    const updateErrorMessage = (msg:string) => {
      setErrorMessage(msg)
      setOpenSnackbar(true)
      usernameRef.current.focus()
    }

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const usernameField = usernameRef.current as HTMLInputElement;
        const passwordField = passwordRef.current as HTMLInputElement;
        const username = usernameField.value;
        const password = passwordField.value;

        usernameField.value = ''
        passwordField.value = ''
  
        // disableFields(true);

        if (username.trim().toLowerCase() === process.env.NEXT_PUBLIC_SHOP_USERNAME && password.trim() === process.env.NEXT_PUBLIC_SHOP_PASSWORD){
          const d = new Date()
          
          document.cookie = `pos=${d.valueOf()}; path=/; max-age=${sessionMinutes * 60}`
          window.location.href = '/';
        } else updateErrorMessage('Wrong username/password')

        // disableFields(false)
    }

    useEffect(()=>{
      document.title = 'Sign In'
    },[])

    return (
        <StyledContainer maxWidth="sm">
          <form onSubmit={onSubmit}>
            <TextField
              inputRef={usernameRef}
              label="User Name"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              type="text"
              sx={{ marginTop: '16px' }} // Add top margin to the username field
            />
            <TextField
              inputRef={passwordRef}
              label="Password"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              type={showPassword ? 'text' : 'password'}
              slotProps={{
                input:{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              type="submit"
              sx={{ marginTop: '16px', marginBottom: '16px' }} // Add bottom margin to the submit button
              disabled={loading}
            >
              Submit
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    right: '16px',
                    color: 'primary',
                  }}
                />
              )}
            </Button>
          </form>
          <Snackbar
            open={openSnackbar}
            autoHideDuration={10000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              severity="error"
              onClose={handleCloseSnackbar}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={handleCloseSnackbar}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {errorMessage}
            </Alert>
          </Snackbar>
        </StyledContainer>
      );
}

export default SignInForm