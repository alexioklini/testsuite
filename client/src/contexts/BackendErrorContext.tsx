import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface BackendErrorContextType {
  showError: (message: string) => void;
  hideError: () => void;
}

const BackendErrorContext = createContext<BackendErrorContextType | undefined>(undefined);

export const useBackendError = () => {
  const context = useContext(BackendErrorContext);
  if (!context) {
    throw new Error('useBackendError must be used within a BackendErrorProvider');
  }
  return context;
};

interface BackendErrorProviderProps {
  children: ReactNode;
}

export const BackendErrorProvider: React.FC<BackendErrorProviderProps> = ({ children }) => {
  const showError = (message: string) => {
    // Dispatch a custom event that the App component can listen for
    window.dispatchEvent(new CustomEvent('backend-error', {
      detail: { message }
    }));
  };

  const hideError = () => {
    // Nothing to do here since the App component handles the Snackbar
  };

  return (
    <BackendErrorContext.Provider value={{ showError, hideError }}>
      {children}
    </BackendErrorContext.Provider>
  );
};