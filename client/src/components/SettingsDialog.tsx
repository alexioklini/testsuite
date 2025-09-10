import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  DialogContentText
} from '@mui/material';
import { Edit, Delete, Add, Save, Cancel } from '@mui/icons-material';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  getVersions,
  createVersion,
  updateVersion,
  deleteVersion
} from '../api';
import { useBackendError } from '../contexts/BackendErrorContext';
import type { Application, Version } from '../../../shared/types';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { showError } = useBackendError();
  const [activeTab, setActiveTab] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    id: 0,
    name: '',
    description: ''
  });
  const [isEditingApplication, setIsEditingApplication] = useState(false);
  
  // Version form state
  const [versionForm, setVersionForm] = useState({
    id: 0,
    application_id: 0,
    version_number: ''
  });
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    type: '', // 'application' or 'version'
    id: 0,
    name: ''
  });

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apps, vers] = await Promise.all([
        getApplications(),
        getVersions()
      ]);
      setApplications(apps);
      setVersions(vers);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load applications and versions');
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset forms when switching tabs
    setApplicationForm({ id: 0, name: '', description: '' });
    setIsEditingApplication(false);
    setVersionForm({ id: 0, application_id: 0, version_number: '' });
    setIsEditingVersion(false);
  };

  // Application handlers
  const handleAddApplication = () => {
    setApplicationForm({ id: 0, name: '', description: '' });
    setIsEditingApplication(true);
  };

  const handleEditApplication = (app: Application) => {
    setApplicationForm({
      id: app.id,
      name: app.name,
      description: app.description || ''
    });
    setIsEditingApplication(true);
  };

  const handleSaveApplication = async () => {
    if (!applicationForm.name.trim()) {
      setError('Application name is required');
      return;
    }

    try {
      if (applicationForm.id) {
        // Update existing application
        await updateApplication(applicationForm.id, {
          name: applicationForm.name,
          description: applicationForm.description
        });
      } else {
        // Create new application
        await createApplication({
          name: applicationForm.name,
          description: applicationForm.description
        });
      }
      
      // Reset form and refresh data
      setApplicationForm({ id: 0, name: '', description: '' });
      setIsEditingApplication(false);
      fetchData();
      setError(null);
    } catch (err: any) {
      console.error('Failed to save application:', err);
      setError('Failed to save application');
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      }
    }
  };

  const handleCancelApplication = () => {
    setApplicationForm({ id: 0, name: '', description: '' });
    setIsEditingApplication(false);
    setError(null);
  };

  const handleDeleteApplicationClick = (app: Application) => {
    setDeleteConfirmation({
      open: true,
      type: 'application',
      id: app.id,
      name: app.name
    });
  };

  // Version handlers
  const handleAddVersion = () => {
    setVersionForm({ id: 0, application_id: 0, version_number: '' });
    setIsEditingVersion(true);
  };

  const handleEditVersion = (ver: Version) => {
    setVersionForm({
      id: ver.id,
      application_id: ver.application_id,
      version_number: ver.version_number
    });
    setIsEditingVersion(true);
  };

  const handleSaveVersion = async () => {
    if (!versionForm.application_id) {
      setError('Please select an application');
      return;
    }
    
    if (!versionForm.version_number.trim()) {
      setError('Version number is required');
      return;
    }

    try {
      if (versionForm.id) {
        // Update existing version
        await updateVersion(versionForm.id, {
          application_id: versionForm.application_id,
          version_number: versionForm.version_number
        });
      } else {
        // Create new version
        await createVersion({
          application_id: versionForm.application_id,
          version_number: versionForm.version_number
        });
      }
      
      // Reset form and refresh data
      setVersionForm({ id: 0, application_id: 0, version_number: '' });
      setIsEditingVersion(false);
      fetchData();
      setError(null);
    } catch (err: any) {
      console.error('Failed to save version:', err);
      setError('Failed to save version');
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      }
    }
  };

  const handleCancelVersion = () => {
    setVersionForm({ id: 0, application_id: 0, version_number: '' });
    setIsEditingVersion(false);
    setError(null);
  };

  const handleDeleteVersionClick = (ver: Version) => {
    const appName = applications.find(app => app.id === ver.application_id)?.name || 'Unknown';
    setDeleteConfirmation({
      open: true,
      type: 'version',
      id: ver.id,
      name: `${ver.version_number} (${appName})`
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirmation.type === 'application') {
        await deleteApplication(deleteConfirmation.id);
      } else if (deleteConfirmation.type === 'version') {
        await deleteVersion(deleteConfirmation.id);
      }
      
      // Close confirmation and refresh data
      setDeleteConfirmation({ open: false, type: '', id: 0, name: '' });
      fetchData();
      setError(null);
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      setError(`Failed to delete ${deleteConfirmation.type}`);
      if (err.message && err.message.includes('Unable to connect')) {
        showError(err.message);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ open: false, type: '', id: 0, name: '' });
  };

  const getApplicationName = (id: number) => {
    const app = applications.find(app => app.id === id);
    return app ? app.name : 'Unknown';
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Applications" />
            <Tab label="Versions" />
          </Tabs>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Applications Tab */}
              {activeTab === 0 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Applications</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Add />} 
                      onClick={handleAddApplication}
                    >
                      Add Application
                    </Button>
                  </Box>
                  
                  {isEditingApplication ? (
                    <Box component="form" sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Application Name"
                        value={applicationForm.name}
                        onChange={(e) => setApplicationForm({...applicationForm, name: e.target.value})}
                        margin="normal"
                        required
                      />
                      <TextField
                        fullWidth
                        label="Description"
                        value={applicationForm.description}
                        onChange={(e) => setApplicationForm({...applicationForm, description: e.target.value})}
                        margin="normal"
                        multiline
                        rows={3}
                      />
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveApplication}
                          sx={{ mr: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          startIcon={<Cancel />}
                          onClick={handleCancelApplication}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : null}
                  
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Description</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>{app.name}</TableCell>
                            <TableCell>{app.description || '-'}</TableCell>
                            <TableCell>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditApplication(app)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteApplicationClick(app)}
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
                </Box>
              )}
              
              {/* Versions Tab */}
              {activeTab === 1 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Versions</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Add />} 
                      onClick={handleAddVersion}
                    >
                      Add Version
                    </Button>
                  </Box>
                  
                  {isEditingVersion ? (
                    <Box component="form" sx={{ mb: 3 }}>
                      <FormControl fullWidth margin="normal" required>
                        <InputLabel>Select Application</InputLabel>
                        <Select
                          value={versionForm.application_id}
                          onChange={(e) => setVersionForm({...versionForm, application_id: Number(e.target.value)})}
                          label="Select Application"
                        >
                          {applications.map((app) => (
                            <MenuItem key={app.id} value={app.id}>
                              {app.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="Version Number"
                        value={versionForm.version_number}
                        onChange={(e) => setVersionForm({...versionForm, version_number: e.target.value})}
                        margin="normal"
                        required
                      />
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveVersion}
                          sx={{ mr: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          startIcon={<Cancel />}
                          onClick={handleCancelVersion}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : null}
                  
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Application</strong></TableCell>
                          <TableCell><strong>Version</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {versions.map((ver) => (
                          <TableRow key={ver.id}>
                            <TableCell>{getApplicationName(ver.application_id)}</TableCell>
                            <TableCell>{ver.version_number}</TableCell>
                            <TableCell>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditVersion(ver)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteVersionClick(ver)}
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
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.open} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the {deleteConfirmation.type} "{deleteConfirmation.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SettingsDialog;