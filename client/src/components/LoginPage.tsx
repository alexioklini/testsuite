import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { Login } from '@mui/icons-material';
import api from '../api';
import { useBackendError } from '../contexts/BackendErrorContext';

function LoginPage() {
  const { showError } = useBackendError();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login-2fa', { username, password });
      const { token, requires2FA, userId } = response.data;

      if (requires2FA) {
        setUserId(userId);
        setShow2FADialog(true);
      } else {
        // Store token in localStorage
        localStorage.setItem('token', token);
        // Redirect to dashboard
        navigate('/');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/2fa/verify', { userId, code: twoFACode });
      const { token } = response.data;

      // Store token in localStorage
      localStorage.setItem('token', token);
      // Close dialog and redirect to dashboard
      setShow2FADialog(false);
      navigate('/');
    } catch (err: any) {
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      } else {
        setError(err.response?.data?.error || '2FA verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/2fa/send-code', { userId });
      // In a real app, you would show a success message
    } catch (err: any) {
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      } else {
        setError(err.response?.data?.error || 'Failed to resend code');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Test Suite Manager
        </Typography>
        <Typography component="h2" variant="h6" gutterBottom>
          Sign in
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            startIcon={!loading ? <Login /> : undefined}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link to="/register">
              Don't have an account? Register
            </Link>
          </Box>
        </Box>
      </Box>

      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onClose={() => setShow2FADialog(false)}>
        <DialogTitle>Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter the 6-digit code sent to your phone.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="code"
            label="6-digit code"
            type="text"
            fullWidth
            variant="outlined"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResendCode} disabled={loading}>
            Resend Code
          </Button>
          <Button onClick={() => setShow2FADialog(false)}>Cancel</Button>
          <Button onClick={handle2FASubmit} variant="contained" disabled={loading || twoFACode.length !== 6}>
            {loading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LoginPage;