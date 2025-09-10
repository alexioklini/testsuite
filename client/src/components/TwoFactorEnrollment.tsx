import { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../api';
import { useBackendError } from '../contexts/BackendErrorContext';

interface TwoFactorEnrollmentProps {
  userId: number;
  onEnrollmentComplete: () => void;
}

function TwoFactorEnrollment({ userId, onEnrollmentComplete }: TwoFactorEnrollmentProps) {
  const { showError } = useBackendError();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState<'phone' | 'verify'>('phone');
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnroll = async () => {
    setLoading(true);
    setError('');

    try {
      // Enroll user with phone number
      await api.post('/auth/2fa/enroll', { userId, phoneNumber });
      
      // Send verification code
      await api.post('/auth/2fa/send-code', { userId });
      
      setEnrollmentStep('verify');
    } catch (err: any) {
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      } else {
        setError(err.response?.data?.error || 'Failed to enroll 2FA');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/2fa/verify', { userId, code: verificationCode });
      onEnrollmentComplete();
    } catch (err: any) {
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      } else {
        setError(err.response?.data?.error || 'Failed to verify code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
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
          Two-Factor Authentication Setup
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {enrollmentStep === 'phone' ? (
          <Box sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter your phone number to enable two-factor authentication.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="phoneNumber"
              label="Phone Number"
              name="phoneNumber"
              autoComplete="tel"
              autoFocus
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleEnroll}
              disabled={loading || !phoneNumber}
            >
              {loading ? <CircularProgress size={24} /> : 'Enroll'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 1, width: '100%' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter the 6-digit code sent to your phone.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="code"
              label="6-digit code"
              name="code"
              autoFocus
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default TwoFactorEnrollment;