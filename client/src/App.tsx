import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BackendErrorProvider } from './contexts/BackendErrorContext';
import Dashboard from './components/Dashboard';
import AdministrationPanel from './components/AdministrationPanel';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Alert, Snackbar } from '@mui/material';

function App() {
  const [backendError, setBackendError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const handleBackendError = (event: CustomEvent) => {
      setBackendError(event.detail.message);
      setSnackbarOpen(true);
    };

    window.addEventListener('backend-error', handleBackendError as EventListener);
    return () => {
      window.removeEventListener('backend-error', handleBackendError as EventListener);
    };
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <BackendErrorProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdministrationPanel />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {backendError}
        </Alert>
      </Snackbar>
    </BackendErrorProvider>
  );
}

export default App;
