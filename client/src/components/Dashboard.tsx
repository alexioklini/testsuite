import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { Edit, Delete, Add, PlayArrow, History, Visibility, Logout, Security, Settings, FactCheck } from '@mui/icons-material';
import api, { checkSuiteHasTests, getApplications, getVersions } from '../api';
import { useBackendError } from '../contexts/BackendErrorContext';
import type { TestSuite, Test, Application, Version } from '../../../shared/types';
import BatchTestExecutionDialog from './BatchTestExecutionDialog';
import SettingsDialog from './SettingsDialog';
import TwoFactorEnrollment from './TwoFactorEnrollment';
import PermissionGuard from './PermissionGuard';

function Dashboard() {
  const { showError } = useBackendError();
  const [user, setUser] = useState<{ id: number; username: string; is_2fa_enabled: boolean } | null>(null);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [suiteDialogOpen, setSuiteDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [viewTestsDialogOpen, setViewTestsDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [deleteTestConfirmDialogOpen, setDeleteTestConfirmDialogOpen] = useState(false);
  const [executingSuite, setExecutingSuite] = useState<TestSuite | null>(null);
  const [suiteExecutionDialogOpen, setSuiteExecutionDialogOpen] = useState(false);
  const [suiteExecutionHistoryDialogOpen, setSuiteExecutionHistoryDialogOpen] = useState(false);
  const [suiteExecutions, setSuiteExecutions] = useState<any[]>([]);
  const [currentSuiteExecution, setCurrentSuiteExecution] = useState<any>(null);
  const [testExecutions, setTestExecutions] = useState<any[]>([]);
  const [testExecutionDialogOpen, setTestExecutionDialogOpen] = useState(false);
  const [executingTest, setExecutingTest] = useState<any>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [batchTestExecutionDialogOpen, setBatchTestExecutionDialogOpen] = useState(false);
  const [show2FAEnrollment, setShow2FAEnrollment] = useState(false);

  // Suite form state
  const [suiteName, setSuiteName] = useState('');
  const [suiteDescription, setSuiteDescription] = useState('');
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);

  // Test form state
  const [testArea, setTestArea] = useState('');
  const [testShortName, setTestShortName] = useState('');
  const [testManualTasks, setTestManualTasks] = useState('');
  const [testExpectedResults, setTestExpectedResults] = useState('');
  const [testIsMandatory, setTestIsMandatory] = useState(false);

  // Suite Execution form state
  const [executionName, setExecutionName] = useState('');
  const [testerName, setTesterName] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [applicationVersion, setApplicationVersion] = useState('');
  
  // Application/Version state
  const [applications, setApplications] = useState<Application[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadingAppsVersions, setLoadingAppsVersions] = useState(false);
  const [appsVersionsError, setAppsVersionsError] = useState<string | null>(null);
  

  // Test Execution form state
  const [testExecutionStatus, setTestExecutionStatus] = useState<'passed' | 'failed'>('passed');
  const [testResultNotes, setTestResultNotes] = useState('');
  const [currentSuiteExecutionId, setCurrentSuiteExecutionId] = useState<number | null>(null);

  useEffect(() => {
    fetchUser();
    fetchSuites();
    fetchApplications();
    fetchVersions();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/user');
      setUser(response.data);
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    }
  };

  const fetchApplications = async () => {
    setLoadingAppsVersions(true);
    setAppsVersionsError(null);
    try {
      const apps = await getApplications();
      setApplications(apps);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      setAppsVersionsError('Failed to load applications');
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    } finally {
      setLoadingAppsVersions(false);
    }
  };

  const fetchVersions = async () => {
    setLoadingAppsVersions(true);
    setAppsVersionsError(null);
    try {
      const vers = await getVersions();
      setVersions(vers);
    } catch (error: any) {
      console.error('Failed to fetch versions:', error);
      setAppsVersionsError('Failed to load versions');
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    } finally {
      setLoadingAppsVersions(false);
    }
  };

  const validateApplicationsExist = () => {
    if (applications.length === 0) {
      showError('No applications available. Please create applications before executing a test suite.');
      return false;
    }
    return true;
  };

  const validateVersionsExist = () => {
    if (versions.length === 0) {
      showError('No versions available. Please create versions before executing a test suite.');
      return false;
    }
    return true;
  };

  const fetchSuites = () => {
    api.get('/test-suites')
      .then(res => setSuites(res.data))
      .catch(error => {
        console.error('Failed to fetch suites:', error);
        if (error.message && error.message.includes('Unable to connect')) {
          showError(error.message);
        }
      });
  };

  const fetchTests = (suiteId: number) => {
    api.get(`/test-suites/${suiteId}/tests`)
      .then(res => setTests(res.data))
      .catch(error => {
        console.error('Failed to fetch tests:', error);
        if (error.message && error.message.includes('Unable to connect')) {
          showError(error.message);
        }
      });
  };

  // Suite handlers
  const handleAddSuite = () => {
    setSuiteDialogOpen(true);
  };

  const handleCloseSuiteDialog = () => {
    setSuiteDialogOpen(false);
    setSuiteName('');
    setSuiteDescription('');
    setEditingSuite(null);
  };

  const handleSubmitSuite = async () => {
    try {
      if (editingSuite) {
        // Edit existing suite
        await api.put(`/test-suites/${editingSuite.id}`, { name: suiteName, description: suiteDescription });
      } else {
        // Add new suite
        await api.post('/test-suites', { name: suiteName, description: suiteDescription });
      }
      fetchSuites();
      handleCloseSuiteDialog();
    } catch (error: any) {
      console.error('Failed to save test suite', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      }
    }
  };

  const handleEditSuite = (suite: TestSuite) => {
    setEditingSuite(suite);
    setSuiteName(suite.name);
    setSuiteDescription(suite.description);
    setSuiteDialogOpen(true);
  };

  const handleDeleteSuite = (suite: TestSuite) => {
    setSuiteToDelete(suite);
    setDeleteConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (suiteToDelete) {
      try {
        await api.delete(`/test-suites/${suiteToDelete.id}`);
        fetchSuites();
        setDeleteConfirmDialogOpen(false);
        setSuiteToDelete(null);
      } catch (error: any) {
        console.error('Failed to delete test suite', error);
        if (error.message && error.message.includes('Unable to connect')) {
          showError(error.message);
        }
      }
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteConfirmDialogOpen(false);
    setSuiteToDelete(null);
  };

  // Test handlers
  const handleViewTests = (suite: TestSuite) => {
    setSelectedSuite(suite);
    fetchTests(suite.id);
    setViewTestsDialogOpen(true);
  };

  const handleAddTest = () => {
    setTestDialogOpen(true);
  };

  const handleCloseTestDialog = () => {
    setTestDialogOpen(false);
    setTestArea('');
    setTestShortName('');
    setTestManualTasks('');
    setTestExpectedResults('');
    setTestIsMandatory(false);
    setEditingTest(null);
  };

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setTestArea(test.area);
    setTestShortName(test.short_name);
    setTestManualTasks(test.manual_tasks);
    setTestExpectedResults(test.expected_results);
    setTestIsMandatory(test.is_mandatory);
    setTestDialogOpen(true);
  };

  const handleDeleteTest = (test: Test) => {
    setTestToDelete(test);
    setDeleteTestConfirmDialogOpen(true);
  };

  const handleConfirmDeleteTest = async () => {
    if (testToDelete && selectedSuite) {
      try {
        await api.delete(`/tests/${testToDelete.id}`);
        fetchTests(selectedSuite.id);
        setDeleteTestConfirmDialogOpen(false);
        setTestToDelete(null);
      } catch (error) {
        console.error('Failed to delete test', error);
      }
    }
  };

  const handleCloseDeleteTestDialog = () => {
    setDeleteTestConfirmDialogOpen(false);
    setTestToDelete(null);
  };

  // Suite Execution handlers
  const handleStartSuiteExecution = async (suite: TestSuite) => {
    try {
      // Check if the suite has tests before opening the execution dialog
      const response = await checkSuiteHasTests(suite.id);
      const tests = response.data;
      
      if (tests.length === 0) {
        showError('Cannot start execution: No tests defined for this test suite. Please add tests before executing.');
        return;
      }
      
      // Validate that applications and versions exist
      if (!validateApplicationsExist() || !validateVersionsExist()) {
        return;
      }
      
      // If suite has tests and validations pass, proceed with opening the execution dialog
      setExecutingSuite(suite);
      setSuiteExecutionDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to check suite tests:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      } else {
        showError('Failed to check suite tests. Please try again.');
      }
    }
  };

  const handleCloseSuiteExecutionDialog = () => {
    setSuiteExecutionDialogOpen(false);
    setExecutingSuite(null);
    setExecutionName('');
    setTesterName('');
    setApplicationName('');
    setApplicationVersion('');
  };

  const handleStartSuiteExecutionSubmit = async () => {
    if (!executingSuite) return;

    // Find the selected application and version objects to get their IDs
    const selectedApplication = applications.find(app => app.name === applicationName);
    const selectedVersion = versions.find(ver => ver.version_number === applicationVersion);

    // Validate that we found both
    if (!selectedApplication || !selectedVersion) {
      showError('Please select a valid application and version.');
      return;
    }

    try {
      console.log('Starting suite execution for suite:', executingSuite.id);
      const response = await api.post(`/test-suites/${executingSuite.id}/start-execution`, {
        execution_name: executionName,
        tester_name: testerName,
        application_id: selectedApplication.id,
        version_id: selectedVersion.id
      });

      console.log('Suite execution started:', response.data);
      console.log('Setting currentSuiteExecutionId to:', response.data.suite_execution_id);
      setCurrentSuiteExecutionId(response.data.suite_execution_id);
      setBatchTestExecutionDialogOpen(true);
      fetchSuites(); // Refresh to show updated status
      handleCloseSuiteExecutionDialog();
    } catch (error: any) {
      console.error('Failed to start suite execution:', error);
      if (error.response?.data?.error) {
        showError(error.response.data.error);
      } else {
        showError(`Failed to start execution: ${error.message}`);
      }
    }
  };

  // Test Execution handlers (within a suite execution)
  const handleRunTestInSuite = (testExecution: any) => {
    setExecutingTest(testExecution);
    setTestExecutionDialogOpen(true);
  };

  const handleCloseTestExecutionDialog = () => {
    setTestExecutionDialogOpen(false);
    setExecutingTest(null);
    setTestExecutionStatus('passed');
    setTestResultNotes('');
  };

  const handleCompleteTestExecution = async () => {
    if (!executingTest) return;

    try {
      await api.put(`/test-executions/${executingTest.id}`, {
        status: testExecutionStatus,
        result_notes: testResultNotes
      });

      // Refresh test executions
      if (currentSuiteExecution) {
        fetchTestExecutions(currentSuiteExecution.id);
      }
      handleCloseTestExecutionDialog();
    } catch (error) {
      console.error('Failed to complete test execution:', error);
    }
  };

  const handleViewSuiteExecutionHistory = (suite: TestSuite) => {
    setExecutingSuite(suite);
    fetchSuiteExecutionHistory(suite.id);
    setSuiteExecutionHistoryDialogOpen(true);
  };

  const handleExecuteSuiteFromHistory = async (suiteId: number, executionId: number) => {
    try {
      // Check if the suite has tests before opening the execution dialog
      const response = await checkSuiteHasTests(suiteId);
      const tests = response.data;
      
      if (tests.length === 0) {
        showError('Cannot start execution: No tests defined for this test suite. Please add tests before executing.');
        return;
      }
      
      // If suite has tests, proceed with opening the execution dialog
      console.log('Opening batch dialog from history with execution ID:', executionId);
      setCurrentSuiteExecutionId(executionId);
      setBatchTestExecutionDialogOpen(true);
      handleCloseSuiteExecutionHistoryDialog();
    } catch (error: any) {
      console.error('Failed to check suite tests:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      } else {
        showError('Failed to check suite tests. Please try again.');
      }
    }
  };

  const fetchSuiteExecutionHistory = async (suiteId: number) => {
    try {
      const response = await api.get(`/test-suites/${suiteId}/executions`);
      setSuiteExecutions(response.data);
    } catch (error) {
      console.error('Failed to fetch suite execution history:', error);
    }
  };

  const fetchTestExecutions = async (suiteExecutionId: number) => {
    try {
      const response = await api.get(`/suite-executions/${suiteExecutionId}/tests`);
      setTestExecutions(response.data);
    } catch (error) {
      console.error('Failed to fetch test executions:', error);
    }
  };

  const handleCloseSuiteExecutionHistoryDialog = () => {
    setSuiteExecutionHistoryDialogOpen(false);
    setExecutingSuite(null);
    setSuiteExecutions([]);
  };

  const handleSubmitTest = async () => {
    if (!selectedSuite) return;

    try {
      if (editingTest) {
        // Edit existing test
        await api.put(`/tests/${editingTest.id}`, {
          area: testArea,
          short_name: testShortName,
          manual_tasks: testManualTasks,
          expected_results: testExpectedResults,
          is_mandatory: testIsMandatory
        });
      } else {
        // Add new test
        await api.post(`/test-suites/${selectedSuite.id}/tests`, {
          area: testArea,
          short_name: testShortName,
          manual_tasks: testManualTasks,
          expected_results: testExpectedResults,
          is_mandatory: testIsMandatory
        });
      }
      fetchTests(selectedSuite.id);
      handleCloseTestDialog();
    } catch (error) {
      console.error('Failed to save test:', error);
    }
  };

  const handleCloseViewTestsDialog = () => {
    setViewTestsDialogOpen(false);
    setSelectedSuite(null);
    setTests([]);
  };

  return (
    <>
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <FactCheck sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
            <Typography variant="h6" component="div" sx={{ mr: 2 }}>
              Test Suite Manager
            </Typography>
            <PermissionGuard permissions={{ task: 'testsuite_management', action: 'write' }}>
              <Button variant="contained" color="primary" onClick={handleAddSuite} startIcon={<Add />} size="small">
                Add Test Suite
              </Button>
            </PermissionGuard>
          </Box>
          {user && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Hello, {user.username}
              </Typography>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              {!user.is_2fa_enabled && (
                <Button
                  color="inherit"
                  onClick={() => setShow2FAEnrollment(true)}
                  sx={{ ml: 2 }}
                  startIcon={<Security />}
                >
                  Enable 2FA
                </Button>
              )}
              <Button
                color="inherit"
                onClick={() => setShowSettingsDialog(true)}
                sx={{ ml: 2 }}
                startIcon={<Settings />}
              >
                Settings
              </Button>
              <PermissionGuard permissions={{ task: 'administration', action: 'read' }}>
                <Button
                  color="inherit"
                  href="/admin"
                  sx={{ ml: 2 }}
                  startIcon={<Security />}
                >
                  Administration
                </Button>
              </PermissionGuard>
              <Button
                color="inherit"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                sx={{ ml: 2 }}
                startIcon={<Logout />}
              >
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container>
        <PermissionGuard
          permissions={{ task: 'testsuite_management', action: 'read' }}
          fallback={<Typography>You don't have permission to view test suites.</Typography>}
        >
          <List>
            {suites.map(suite => (
              <ListItem key={suite.id}>
                <ListItemText primary={suite.name} secondary={suite.description} />
                <PermissionGuard permissions={{ task: 'testsuite_execution', action: 'write' }}>
                  <Button onClick={() => handleStartSuiteExecution(suite)} color="success" startIcon={<PlayArrow />}>Start Execution</Button>
                </PermissionGuard>
                <PermissionGuard permissions={{ task: 'testsuite_execution', action: 'read' }}>
                  <Button onClick={() => handleViewSuiteExecutionHistory(suite)} color="info" startIcon={<History />}>Execution History</Button>
                </PermissionGuard>
                <PermissionGuard permissions={{ task: 'test_management', action: 'read' }}>
                  <Button onClick={() => handleViewTests(suite)} startIcon={<Visibility />}>View Tests</Button>
                </PermissionGuard>
                <PermissionGuard permissions={{ task: 'testsuite_management', action: 'write' }}>
                  <Button onClick={() => handleEditSuite(suite)} startIcon={<Edit />}>Edit</Button>
                </PermissionGuard>
                <PermissionGuard permissions={{ task: 'testsuite_management', action: 'delete' }}>
                  <Button onClick={() => handleDeleteSuite(suite)} color="error" startIcon={<Delete />}>Delete</Button>
                </PermissionGuard>
              </ListItem>
            ))}
          </List>
        </PermissionGuard>

      {/* Add/Edit Test Suite Dialog */}
      <Dialog open={suiteDialogOpen} onClose={handleCloseSuiteDialog}>
        <DialogTitle>{editingSuite ? 'Edit Test Suite' : 'Add Test Suite'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={suiteName}
            onChange={(e) => setSuiteName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={suiteDescription}
            onChange={(e) => setSuiteDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuiteDialog}>Cancel</Button>
          <Button onClick={handleSubmitSuite} variant="contained">
            {editingSuite ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the test suite "{suiteToDelete?.name}"?
            This action cannot be undone and will also delete all associated tests.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Test Confirmation Dialog */}
      <Dialog open={deleteTestConfirmDialogOpen} onClose={handleCloseDeleteTestDialog}>
        <DialogTitle>Confirm Delete Test</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the test "{testToDelete?.short_name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteTestDialog}>Cancel</Button>
          <Button onClick={handleConfirmDeleteTest} color="error" variant="contained">
            Delete Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Tests Dialog */}
      <Dialog open={viewTestsDialogOpen} onClose={handleCloseViewTestsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Tests for {selectedSuite?.name}
          <Button onClick={handleAddTest} variant="contained" sx={{ ml: 2 }} startIcon={<Add />}>
            Add Test
          </Button>
        </DialogTitle>
        <DialogContent>
          {tests.length === 0 ? (
            <Typography>No tests found for this suite.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Area</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Mandatory</strong></TableCell>
                    <TableCell><strong>Manual Tasks</strong></TableCell>
                    <TableCell><strong>Expected Results</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.map(test => (
                    <TableRow key={test.id}>
                      <TableCell>{test.short_name}</TableCell>
                      <TableCell>{test.area}</TableCell>
                      <TableCell>{test.status}</TableCell>
                      <TableCell>{test.is_mandatory ? 'Yes' : 'No'}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {test.manual_tasks || 'No tasks'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {test.expected_results || 'No results'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Test">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTest(test)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Test">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTest(test)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewTestsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Test Dialog */}
      <Dialog open={testDialogOpen} onClose={handleCloseTestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTest ? 'Edit Test' : `Add Test to ${selectedSuite?.name}`}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Area"
            fullWidth
            variant="outlined"
            value={testArea}
            onChange={(e) => setTestArea(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Short Name"
            fullWidth
            variant="outlined"
            value={testShortName}
            onChange={(e) => setTestShortName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Manual Tasks"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={testManualTasks}
            onChange={(e) => setTestManualTasks(e.target.value)}
            helperText="Enter the manual tasks as plain text"
          />
          <TextField
            margin="dense"
            label="Expected Results"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={testExpectedResults}
            onChange={(e) => setTestExpectedResults(e.target.value)}
            helperText="Enter the expected results as plain text"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={testIsMandatory}
                onChange={(e) => setTestIsMandatory(e.target.checked)}
              />
            }
            label="Is Mandatory"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog}>Cancel</Button>
          <Button onClick={handleSubmitTest} variant="contained">
            {editingTest ? 'Save Changes' : 'Add Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suite Execution Dialog */}
      <Dialog open={suiteExecutionDialogOpen} onClose={handleCloseSuiteExecutionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Start Test Suite Execution: {executingSuite?.name}</DialogTitle>
        <DialogContent>
          {loadingAppsVersions && (
            <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
              <CircularProgress />
            </Box>
          )}
          {appsVersionsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {appsVersionsError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Execution Name"
            fullWidth
            variant="outlined"
            value={executionName}
            onChange={(e) => setExecutionName(e.target.value)}
            placeholder="e.g., Sprint 15 Testing"
            required
          />
          <TextField
            margin="dense"
            label="Tester Name"
            fullWidth
            variant="outlined"
            value={testerName}
            onChange={(e) => setTesterName(e.target.value)}
            required
          />
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="application-select-label">Application</InputLabel>
            <Select
              labelId="application-select-label"
              value={applicationName}
              onChange={(e) => setApplicationName(e.target.value)}
              label="Application"
            >
              {applications.map((app) => (
                <MenuItem key={app.id} value={app.name}>
                  {app.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="version-select-label">Version</InputLabel>
            <Select
              labelId="version-select-label"
              value={applicationVersion}
              onChange={(e) => setApplicationVersion(e.target.value)}
              label="Version"
            >
              {versions.map((ver) => (
                <MenuItem key={ver.id} value={ver.version_number}>
                  {ver.version_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuiteExecutionDialog}>Cancel</Button>
          <Button
            onClick={handleStartSuiteExecutionSubmit}
            variant="contained"
            disabled={!executionName || !testerName || !applicationName || !applicationVersion || loadingAppsVersions}
          >
            Start Suite Execution
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suite Execution History Dialog */}
      <Dialog open={suiteExecutionHistoryDialogOpen} onClose={handleCloseSuiteExecutionHistoryDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Suite Execution History: {executingSuite?.name}</DialogTitle>
        <DialogContent>
          {suiteExecutions.length === 0 ? (
            <Typography>No execution history found for this suite.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Execution Name</strong></TableCell>
                    <TableCell><strong>Started</strong></TableCell>
                    <TableCell><strong>Completed</strong></TableCell>
                    <TableCell><strong>Tester</strong></TableCell>
                    <TableCell><strong>Application</strong></TableCell>
                    <TableCell><strong>Version</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suiteExecutions.map((execution: any) => (
                    <TableRow key={execution.id}>
                      <TableCell>{execution.execution_name}</TableCell>
                      <TableCell>{new Date(execution.started_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : 'In Progress'}
                      </TableCell>
                      <TableCell>{execution.tester_name}</TableCell>
                      <TableCell>{execution.application_name}</TableCell>
                      <TableCell>{execution.application_version}</TableCell>
                      <TableCell>
                        <Chip
                          label={execution.status}
                          color={execution.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {execution.passed_tests}/{execution.total_tests} tests
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            if (executingSuite) {
                              handleExecuteSuiteFromHistory(executingSuite.id, execution.id);
                            }
                          }}
                        >
                          Execute
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuiteExecutionHistoryDialog}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              // Check if there are any executions
              if (suiteExecutions.length === 0) {
                showError('No test executions available to execute.');
                return;
              }
              
              // Get the most recent execution for the suite
              if (executingSuite) {
                const latestExecution = suiteExecutions[0];
                
                // Check if all tests in this execution are finished
                if (latestExecution.total_tests > 0 &&
                    latestExecution.passed_tests + latestExecution.failed_tests >= latestExecution.total_tests) {
                  showError('All test executions are finished. Cannot execute a completed test suite.');
                  return;
                }
                
                handleExecuteSuiteFromHistory(executingSuite.id, latestExecution.id);
              }
            }}
          >
            Execute Latest
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Execution Dialog (within suite execution) */}
      <Dialog open={testExecutionDialogOpen} onClose={handleCloseTestExecutionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Execute Test: {executingTest?.short_name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Area: {executingTest?.area} | Mandatory: {executingTest?.is_mandatory ? 'Yes' : 'No'}
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            <strong>Manual Tasks:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 1 }}>
            {executingTest?.manual_tasks || 'No manual tasks specified'}
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Expected Results:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, pl: 1 }}>
            {executingTest?.expected_results || 'No expected results specified'}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={testExecutionStatus === 'passed'}
                onChange={(e) => setTestExecutionStatus(e.target.checked ? 'passed' : 'failed')}
              />
            }
            label="Test Passed"
          />

          <TextField
            margin="dense"
            label="Execution Notes"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={testResultNotes}
            onChange={(e) => setTestResultNotes(e.target.value)}
            placeholder="Enter any notes about the test execution..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestExecutionDialog}>Cancel</Button>
          <Button onClick={handleCompleteTestExecution} variant="contained">
            Complete Test
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Test Execution Dialog */}
      <BatchTestExecutionDialog
        open={batchTestExecutionDialogOpen}
        onClose={() => setBatchTestExecutionDialogOpen(false)}
        suiteExecutionId={currentSuiteExecutionId || 0}
        suiteName={executingSuite?.name || ''}
      />
      
      {/* 2FA Enrollment Dialog */}
      <Dialog open={show2FAEnrollment} onClose={() => setShow2FAEnrollment(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {user && (
            <TwoFactorEnrollment
              userId={user.id}
              onEnrollmentComplete={() => {
                setShow2FAEnrollment(false);
                // Refresh user data to show 2FA is enabled
                fetchUser();
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShow2FAEnrollment(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </Container>
  </>
);
}

export default Dashboard;