import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import { Delete, AttachFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api, { uploadFile, getTestExecutionFiles, deleteTestExecution } from '../api';
import { useBackendError } from '../contexts/BackendErrorContext';
import type { TestExecution, TestExecutionFile, SuiteExecution } from '../../../shared/types';

interface BatchTestExecutionDialogProps {
  open: boolean;
  onClose: () => void;
  suiteExecutionId: number;
  suiteName: string;
}

function BatchTestExecutionDialog({ open, onClose, suiteExecutionId, suiteName }: BatchTestExecutionDialogProps) {
  const { showError } = useBackendError();
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
  const [testExecutionResults, setTestExecutionResults] = useState<Record<number, { status: 'passed' | 'failed' | 'not_tested'; notes: string; files: File[]; uploadedFiles: TestExecutionFile[] }>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; testExecutionId: number | null; testExecutionName: string }>({ open: false, testExecutionId: null, testExecutionName: '' });
  const [suiteExecution, setSuiteExecution] = useState<SuiteExecution | null>(null);

  useEffect(() => {
    console.log('BatchTestExecutionDialog useEffect triggered:', { open, suiteExecutionId, suiteName });
    if (open && suiteExecutionId !== null && suiteExecutionId > 0) {
      fetchSuiteExecution();
      fetchTestExecutions();
    }
  }, [open, suiteExecutionId]);

  const fetchSuiteExecution = async () => {
    try {
      console.log('Fetching suite execution with ID:', suiteExecutionId);
      const response = await api.get(`/suite-executions/${suiteExecutionId}`);
      console.log('Suite execution response:', response.data);
      setSuiteExecution(response.data);
      console.log('Suite execution state set:', response.data);
    } catch (error: any) {
      console.error('Failed to fetch suite execution:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    }
  };

  const fetchTestExecutions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suite-executions/${suiteExecutionId}/tests`);
      setTestExecutions(response.data);

      // Initialize test execution results
      const initialResults: Record<number, { status: 'passed' | 'failed' | 'not_tested'; notes: string; files: File[]; uploadedFiles: TestExecutionFile[] }> = {};
      response.data.forEach((testExecution: TestExecution) => {
        initialResults[testExecution.id] = {
          status: testExecution.status === 'passed' || testExecution.status === 'failed' ? testExecution.status : 'not_tested',
          notes: testExecution.result_notes || '',
          files: [],
          uploadedFiles: []
        };
      });
      setTestExecutionResults(initialResults);

      // Fetch existing files for each test execution
      await Promise.all(response.data.map(async (testExecution: TestExecution) => {
        try {
          const fileResponse = await getTestExecutionFiles(testExecution.id);
          initialResults[testExecution.id].uploadedFiles = fileResponse.data;
        } catch (error: any) {
          console.error(`Failed to fetch files for test execution ${testExecution.id}:`, error);
          if (error.message && error.message.includes('Unable to connect')) {
            showError(error.message);
          }
        }
      }));

      setTestExecutionResults({ ...initialResults });
    } catch (error: any) {
      console.error('Failed to fetch test executions:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    } finally {
        setLoading(false);
      }
    };
  
    const handleDeleteClick = (testExecutionId: number, testExecutionName: string) => {
      setDeleteConfirmation({ open: true, testExecutionId, testExecutionName });
    };
  
    const confirmDelete = async () => {
      if (deleteConfirmation.testExecutionId === null) return;
      
      try {
        setDeleting(prev => ({ ...prev, [deleteConfirmation.testExecutionId!]: true }));
        await deleteTestExecution(deleteConfirmation.testExecutionId!);
        // Remove the deleted test execution from the state
        setTestExecutions(prev => prev.filter(execution => execution.id !== deleteConfirmation.testExecutionId));
        // Also remove its results from the state
        setTestExecutionResults(prev => {
          const newResults = { ...prev };
          delete newResults[deleteConfirmation.testExecutionId!];
          return newResults;
        });
        setDeleteConfirmation({ open: false, testExecutionId: null, testExecutionName: '' });
      } catch (error: any) {
        console.error('Error deleting test execution:', error);
        if (error.message && error.message.includes('Unable to connect')) {
          showError(error.message);
        } else {
          showError('Failed to delete test execution');
        }
      } finally {
        setDeleting(prev => {
          const newDeleting = { ...prev };
          delete newDeleting[deleteConfirmation.testExecutionId!];
          return newDeleting;
        });
      }
    };
  
    const cancelDelete = () => {
      setDeleteConfirmation({ open: false, testExecutionId: null, testExecutionName: '' });
    };

  const handleStatusChange = (testExecutionId: number, status: 'passed' | 'failed' | 'not_tested') => {
    setTestExecutionResults(prev => ({
      ...prev,
      [testExecutionId]: {
        ...prev[testExecutionId],
        status
      }
    }));
  };

  const handleNotesChange = (testExecutionId: number, notes: string) => {
    setTestExecutionResults(prev => ({
      ...prev,
      [testExecutionId]: {
        ...prev[testExecutionId],
        notes
      }
    }));
  };

  const handleFileDrop = (testExecutionId: number, acceptedFiles: File[]) => {
    setTestExecutionResults(prev => ({
      ...prev,
      [testExecutionId]: {
        ...prev[testExecutionId],
        files: [...prev[testExecutionId].files, ...acceptedFiles]
      }
    }));
  };

  const removeFile = (testExecutionId: number, fileIndex: number) => {
    setTestExecutionResults(prev => {
      const newFiles = [...prev[testExecutionId].files];
      newFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [testExecutionId]: {
          ...prev[testExecutionId],
          files: newFiles
        }
      };
    });
  };

  const removeUploadedFile = (testExecutionId: number, fileIndex: number) => {
    setTestExecutionResults(prev => {
      const newFiles = [...prev[testExecutionId].uploadedFiles];
      newFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [testExecutionId]: {
          ...prev[testExecutionId],
          uploadedFiles: newFiles
        }
      };
    });
  };

  const saveTestExecution = async (testExecutionId: number) => {
    try {
      const result = testExecutionResults[testExecutionId];
      
      // Debugging: Log what we're sending to the server
      console.log('Saving test execution:', testExecutionId);
      console.log('Sending data to server:', {
        status: result.status,
        result_notes: result.notes
      });
      
      // Update test execution status and notes
      const response = await api.put(`/test-executions/${testExecutionId}`, {
        status: result.status,
        result_notes: result.notes
      });
      
      console.log('Server response:', response.data);
      
      // Upload new files
      for (const file of result.files) {
        await uploadFile(testExecutionId, file);
      }
      
      // Refresh files
      const fileResponse = await getTestExecutionFiles(testExecutionId);
      setTestExecutionResults(prev => ({
        ...prev,
        [testExecutionId]: {
          ...prev[testExecutionId],
          files: [],
          uploadedFiles: fileResponse.data
        }
      }));
    } catch (error: any) {
      console.error('Failed to save test execution:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      } else {
        // Show error to user
        alert(`Failed to save test execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const saveAllTestExecutions = async () => {
    try {
      // Save all test executions
      await Promise.all(
        testExecutions.map(testExecution => saveTestExecution(testExecution.id))
      );
      
      // Refresh test executions
      await fetchTestExecutions();
    } catch (error: any) {
      console.error('Failed to save all test executions:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    }
  };

  const areAllTestsCompleted = () => {
    return testExecutions.every(testExecution => 
      testExecutionResults[testExecution.id] && 
      (testExecutionResults[testExecution.id].status === 'passed' || 
       testExecutionResults[testExecution.id].status === 'failed')
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Execute Test Suite: {suiteName}</DialogTitle>
      <DialogContent>
        {suiteExecution && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Execution Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Execution Name</Typography>
                <Typography variant="body1" fontWeight="medium">{suiteExecution.execution_name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Tester Name</Typography>
                <Typography variant="body1" fontWeight="medium">{suiteExecution.tester_name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Application</Typography>
                <Typography variant="body1" fontWeight="medium">{suiteExecution.application_name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Version</Typography>
                <Typography variant="body1" fontWeight="medium">{suiteExecution.application_version}</Typography>
              </Box>
            </Box>
          </Box>
        )}
        {loading ? (
          <Typography>Loading test executions...</Typography>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Test Name</strong></TableCell>
                    <TableCell><strong>Area</strong></TableCell>
                    <TableCell><strong>Mandatory</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                    <TableCell><strong>Details</strong></TableCell>
                    <TableCell><strong>Evidence</strong></TableCell>
                    <TableCell><strong>Result</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testExecutions.map(testExecution => (
                    <TableRow key={testExecution.id}>
                      <TableCell>{testExecution.short_name}</TableCell>
                      <TableCell>{testExecution.area}</TableCell>
                      <TableCell>
                        <Chip
                          label={testExecution.is_mandatory ? 'Yes' : 'No'}
                          color={testExecution.is_mandatory ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={testExecutionResults[testExecution.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(testExecution.id, e.target.value)}
                          placeholder="Add notes about the test execution..."
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Manual Tasks:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, pl: 1 }}>
                          {testExecution.manual_tasks || 'No manual tasks specified'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Expected Results:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, pl: 1 }}>
                          {testExecution.expected_results || 'No expected results specified'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FileUploadArea
                          testExecutionId={testExecution.id}
                          onDrop={handleFileDrop}
                          files={testExecutionResults[testExecution.id]?.files || []}
                          uploadedFiles={testExecutionResults[testExecution.id]?.uploadedFiles || []}
                          onRemoveFile={removeFile}
                          onRemoveUploadedFile={removeUploadedFile}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth>
                          <Select
                            value={testExecutionResults[testExecution.id]?.status || 'not_tested'}
                            onChange={(e) => handleStatusChange(testExecution.id, e.target.value as 'passed' | 'failed' | 'not_tested')}
                            size="small"
                          >
                            <MenuItem value="not_tested">Not Tested</MenuItem>
                            <MenuItem value="passed">OK</MenuItem>
                            <MenuItem value="failed">NOK</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => saveTestExecution(testExecution.id)}
                          sx={{ mr: 1 }}
                        >
                          Save
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(testExecution.id, testExecution.short_name || 'Unnamed Test')}
                          disabled={deleting[testExecution.id]}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {areAllTestsCompleted() && (
              <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
                <Typography variant="h6" color="success.dark">
                  All tests completed! The suite execution will be marked as done.
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={saveAllTestExecutions}
          disabled={loading}
        >
          Save All
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onClose}
          disabled={!areAllTestsCompleted()}
        >
          Finish Execution
        </Button>
      </DialogActions>
      
      <Dialog open={deleteConfirmation.open} onClose={cancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the test execution "{deleteConfirmation.testExecutionName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

interface FileUploadAreaProps {
  testExecutionId: number;
  onDrop: (testExecutionId: number, acceptedFiles: File[]) => void;
  files: File[];
  uploadedFiles: TestExecutionFile[];
  onRemoveFile: (testExecutionId: number, fileIndex: number) => void;
  onRemoveUploadedFile: (testExecutionId: number, fileIndex: number) => void;
}

function FileUploadArea({ testExecutionId, onDrop, files, uploadedFiles, onRemoveFile, onRemoveUploadedFile }: FileUploadAreaProps) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(testExecutionId, acceptedFiles),
    multiple: true
  });

  return (
    <Box>
      <div {...getRootProps()} style={{ 
        border: '2px dashed #ccc', 
        borderRadius: 4, 
        padding: 16, 
        textAlign: 'center',
        cursor: 'pointer',
        marginBottom: 8
      }}>
        <input {...getInputProps()} />
        <AttachFile />
        <Typography variant="body2">Drag & drop files here, or click to select</Typography>
        <Typography variant="caption">Supports images, PDFs, and other documents</Typography>
      </div>
      
      {files.length > 0 && (
        <Box mt={1}>
          <Typography variant="subtitle2">Pending Uploads:</Typography>
          {files.map((file, index) => (
            <Box key={index} display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">{file.name}</Typography>
              <IconButton size="small" onClick={() => onRemoveFile(testExecutionId, index)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      
      {uploadedFiles.length > 0 && (
        <Box mt={1}>
          <Typography variant="subtitle2">Uploaded Files:</Typography>
          {uploadedFiles.map((file, index) => (
            <Box key={file.id} display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">{file.file_name}</Typography>
              <IconButton size="small" onClick={() => onRemoveUploadedFile(testExecutionId, index)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default BatchTestExecutionDialog;