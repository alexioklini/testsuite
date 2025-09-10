import axios from 'axios';
import type { Application, Version, SuiteExecution } from '../../shared/types';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's a network error (backend not reachable)
    if (!error.response) {
      // Network error - backend is not reachable
      const networkErrorMessage = 'Unable to connect to the backend server. Please check your connection and try again.';
      
      // If we're in a browser environment, we can dispatch a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('backend-error', {
          detail: { message: networkErrorMessage }
        }));
      }
      
      return Promise.reject(new Error(networkErrorMessage));
    }
    
    // For other errors, just pass them through
    return Promise.reject(error);
  }
);

// Application API functions
export const getApplications = async (): Promise<Application[]> => {
  const response = await api.get('/applications');
  return response.data;
};

export const createApplication = async (application: Omit<Application, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.post('/applications', application);
  return response.data;
};

export const updateApplication = async (id: number, application: Partial<Application>) => {
  const response = await api.put(`/applications/${id}`, application);
  return response.data;
};

export const deleteApplication = async (id: number) => {
  const response = await api.delete(`/applications/${id}`);
  return response.data;
};

// Version API functions
export const getVersions = async (applicationId?: number): Promise<Version[]> => {
  const params = applicationId ? { application_id: applicationId } : {};
  const response = await api.get('/versions', { params });
  return response.data;
};

export const createVersion = async (version: Omit<Version, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.post('/versions', version);
  return response.data;
};

export const updateVersion = async (id: number, version: Partial<Version>) => {
  const response = await api.put(`/versions/${id}`, version);
  return response.data;
};

export const deleteVersion = async (id: number) => {
  const response = await api.delete(`/versions/${id}`);
  return response.data;
};

// Suite Execution API functions
export const startSuiteExecution = async (
  suiteId: number,
  executionData: {
    execution_name: string;
    tester_name: string;
    application_id: number;
    version_id: number;
  }
) => {
  const response = await api.post(`/test-suites/${suiteId}/start-execution`, executionData);
  return response.data;
};

export const getSuiteExecutions = async (suiteId: number): Promise<SuiteExecution[]> => {
  const response = await api.get(`/test-suites/${suiteId}/executions`);
  return response.data;
};

export const getSuiteExecution = async (executionId: number): Promise<SuiteExecution> => {
  const response = await api.get(`/suite-executions/${executionId}`);
  return response.data;
};

// Add a function to upload files
export const uploadFile = async (testExecutionId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(`/test-executions/${testExecutionId}/upload-file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Add a function to get files for a test execution
export const getTestExecutionFiles = async (testExecutionId: number) => {
  return api.get(`/test-executions/${testExecutionId}/files`);
};

// Add a function to check if a suite has tests
export const checkSuiteHasTests = async (suiteId: number) => {
  return api.get(`/test-suites/${suiteId}/tests`);
};

// Add a function to delete a test execution
export const deleteTestExecution = async (testExecutionId: number) => {
  return api.delete(`/test-executions/${testExecutionId}`);
};

export default api;