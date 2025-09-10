import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  ListItemText
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  Lock, 
  Security, 
  Person, 
  Group, 
  Assignment, 
  Refresh 
} from '@mui/icons-material';
import api from '../api';
import { useBackendError } from '../contexts/BackendErrorContext';

interface User {
  id: number;
  username: string;
  real_name?: string;
  email?: string;
  phone_number: string;
  is_2fa_enabled: boolean;
  created_at: string;
  roles: string[];
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: {
    task_name: string;
    action: string;
    description: string;
  }[];
}

interface Permission {
  id: number;
  task_name: string;
  action: string;
  description: string;
}

function AdministrationPanel() {
  const { showError } = useBackendError();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // User management state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userRealName, setUserRealName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Role management state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<{ task_name: string; action: string }[]>([]);
  
  // User assignment state
  const [userAssignmentDialogOpen, setUserAssignmentDialogOpen] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<number[]>([]);
  
  // Permission assignment state
  const [permissionAssignmentDialogOpen, setPermissionAssignmentDialogOpen] = useState(false);
  const [assignmentPermissions, setAssignmentPermissions] = useState<{ task_name: string; action: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        // Fetch users
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } else if (activeTab === 1) {
        // Fetch roles
        const response = await api.get('/admin/roles');
        setRoles(response.data);
      } else if (activeTab === 2) {
        // Fetch permissions
        const response = await api.get('/admin/permissions');
        setPermissions(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      if (error.message && error.message.includes('Unable to connect')) {
        showError(error.message);
      } else {
        showError('Failed to fetch data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResetPassword = async (userId: number) => {
    if (!newPassword) {
      setSnackbar({ open: true, message: 'Please enter a new password', severity: 'error' });
      return;
    }
    
    try {
      await api.put(`/admin/users/${userId}/reset-password`, { newPassword });
      setSnackbar({ open: true, message: 'Password reset successfully', severity: 'success' });
      setUserDialogOpen(false);
      setNewPassword('');
      fetchData();
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to reset password', severity: 'error' });
      }
    }
  };

  const handleReset2FA = async (userId: number) => {
    try {
      await api.put(`/admin/users/${userId}/reset-2fa`);
      setSnackbar({ open: true, message: '2FA reset successfully', severity: 'success' });
      fetchData();
    } catch (error: any) {
      console.error('Failed to reset 2FA:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to reset 2FA', severity: 'error' });
      }
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      setSnackbar({ open: true, message: 'User deactivated successfully', severity: 'success' });
      fetchData();
    } catch (error: any) {
      console.error('Failed to deactivate user:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to deactivate user', severity: 'error' });
      }
    }
  };

  const handleSaveRole = async () => {
    try {
      if (selectedRole) {
        // Edit existing role
        await api.put(`/admin/roles/${selectedRole.id}`, {
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions
        });
        setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
      } else {
        // Create new role
        await api.post('/admin/roles', {
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions
        });
        setSnackbar({ open: true, message: 'Role created successfully', severity: 'success' });
      }
      setRoleDialogOpen(false);
      resetRoleForm();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save role:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to save role', severity: 'error' });
      }
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    try {
      await api.delete(`/admin/roles/${roleId}`);
      setSnackbar({ open: true, message: 'Role deleted successfully', severity: 'success' });
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete role', severity: 'error' });
      }
    }
  };

  const handleAssignRoles = async () => {
    if (!assignmentUser) return;
    
    try {
      await api.post(`/admin/users/${assignmentUser.id}/roles`, {
        roleIds: userRoles
      });
      setSnackbar({ open: true, message: 'Roles assigned successfully', severity: 'success' });
      setUserAssignmentDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to assign roles:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to assign roles', severity: 'error' });
      }
    }
  };

  const handleAssignPermissions = async () => {
    if (!assignmentUser) return;
    
    try {
      await api.post(`/admin/users/${assignmentUser.id}/permissions`, {
        permissions: assignmentPermissions
      });
      setSnackbar({ open: true, message: 'Permissions assigned successfully', severity: 'success' });
      setPermissionAssignmentDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to assign permissions:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to assign permissions', severity: 'error' });
      }
    }
  };

  const handleUpdateUserInfo = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/admin/users/${selectedUser.id}/update-info`, {
        real_name: userRealName,
        email: userEmail
      });
      setSnackbar({ open: true, message: 'User info updated successfully', severity: 'success' });
      fetchData(); // Refresh the user list
    } catch (error: any) {
      console.error('Failed to update user info:', error);
      if (error.response?.data?.error) {
        setSnackbar({ open: true, message: error.response.data.error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Failed to update user info', severity: 'error' });
      }
    }
  };

  const resetRoleForm = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setRolePermissions([]);
  };

  const openUserDialog = (user: User) => {
    setSelectedUser(user);
    setUserRealName(user.real_name || '');
    setUserEmail(user.email || '');
    setUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
    setUserRealName('');
    setUserEmail('');
    setNewPassword('');
  };

  const openRoleDialog = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description);
      setRolePermissions(role.permissions.map(p => ({ task_name: p.task_name, action: p.action })));
    } else {
      resetRoleForm();
    }
    setRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setRoleDialogOpen(false);
    resetRoleForm();
  };

  const openUserAssignmentDialog = (user: User) => {
    setAssignmentUser(user);
    // Get role IDs for this user
    const userRoleIds = roles
      .filter(role => user.roles.includes(role.name))
      .map(role => role.id);
    setUserRoles(userRoleIds);
    setUserAssignmentDialogOpen(true);
  };

  const closeUserAssignmentDialog = () => {
    setUserAssignmentDialogOpen(false);
    setAssignmentUser(null);
    setUserRoles([]);
  };

  const openPermissionAssignmentDialog = (user: User) => {
    setAssignmentUser(user);
    // For simplicity, we'll leave this empty for now
    // In a real implementation, you would fetch the user's current permissions
    setAssignmentPermissions([]);
    setPermissionAssignmentDialogOpen(true);
  };

  const closePermissionAssignmentDialog = () => {
    setPermissionAssignmentDialogOpen(false);
    setAssignmentUser(null);
    setAssignmentPermissions([]);
  };

  const handleRolePermissionChange = (taskName: string, action: string, checked: boolean) => {
    if (checked) {
      setRolePermissions([...rolePermissions, { task_name: taskName, action }]);
    } else {
      setRolePermissions(
        rolePermissions.filter(
          p => !(p.task_name === taskName && p.action === action)
        )
      );
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.task_name]) {
      acc[permission.task_name] = [];
    }
    acc[permission.task_name].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Administration Panel
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="User Management" icon={<Person />} />
          <Tab label="Role Management" icon={<Group />} />
          <Tab label="Permission Management" icon={<Assignment />} />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* User Management Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                User Management
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Real Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>2FA Enabled</TableCell>
                      <TableCell>Roles</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.real_name || 'N/A'}</TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.phone_number || 'N/A'}</TableCell>
                        <TableCell>
                          {user.is_2fa_enabled ? (
                            <Chip label="Enabled" color="success" size="small" />
                          ) : (
                            <Chip label="Disabled" color="default" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.roles.map((role, index) => (
                            <Chip key={index} label={role} size="small" sx={{ mr: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Manage User">
                            <IconButton onClick={() => openUserDialog(user)} size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Assign Roles">
                            <IconButton onClick={() => openUserAssignmentDialog(user)} size="small">
                              <Group />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Assign Permissions">
                            <IconButton onClick={() => openPermissionAssignmentDialog(user)} size="small">
                              <Assignment />
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
          
          {/* Role Management Tab */}
          {activeTab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" gutterBottom>
                  Role Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => openRoleDialog()}
                >
                  Add Role
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          {role.permissions.map((perm, index) => (
                            <Chip
                              key={index}
                              label={`${perm.task_name}:${perm.action}`}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit Role">
                            <IconButton onClick={() => openRoleDialog(role)} size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Role">
                            <IconButton onClick={() => handleDeleteRole(role.id)} size="small">
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
          
          {/* Permission Management Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Permission Management
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(groupedPermissions).map(([taskName, taskPermissions]) => (
                      <TableRow key={taskName}>
                        <TableCell rowSpan={taskPermissions.length}>{taskName}</TableCell>
                        <TableCell>{taskPermissions[0].action}</TableCell>
                        <TableCell>{taskPermissions[0].description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
      
      {/* User Management Dialog */}
      <Dialog open={userDialogOpen} onClose={closeUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage User: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Real Name"
              value={userRealName}
              onChange={(e) => setUserRealName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpdateUserInfo}
                fullWidth
              >
                Update Info
              </Button>
            </Box>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<Lock />}
                onClick={() => selectedUser && handleResetPassword(selectedUser.id)}
                fullWidth
              >
                Reset Password
              </Button>
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={() => selectedUser && handleReset2FA(selectedUser.id)}
                fullWidth
              >
                Reset 2FA
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => selectedUser && handleDeactivateUser(selectedUser.id)}
                fullWidth
              >
                Deactivate
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onClose={closeRoleDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Edit Role' : 'Add Role'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            margin="normal"
          />
          
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Permissions
          </Typography>
          
          {Object.entries(groupedPermissions).map(([taskName, taskPermissions]) => (
            <Box key={taskName} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{taskName}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {taskPermissions.map((permission) => (
                  <FormControlLabel
                    key={`${permission.task_name}:${permission.action}`}
                    control={
                      <Checkbox
                        checked={rolePermissions.some(
                          p => p.task_name === permission.task_name && p.action === permission.action
                        )}
                        onChange={(e) =>
                          handleRolePermissionChange(
                            permission.task_name,
                            permission.action,
                            e.target.checked
                          )
                        }
                      />
                    }
                    label={permission.action}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained">
            {selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Assignment Dialog */}
      <Dialog open={userAssignmentDialogOpen} onClose={closeUserAssignmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Roles to {assignmentUser?.username}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Roles</InputLabel>
            <Select
              multiple
              value={userRoles}
              onChange={(e) => setUserRoles(e.target.value as number[])}
              renderValue={(selected) => {
                const selectedRoles = roles.filter(role => 
                  (selected as number[]).includes(role.id)
                );
                return selectedRoles.map(role => role.name).join(', ');
              }}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={userRoles.includes(role.id)} />
                  <ListItemText primary={role.name} secondary={role.description} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserAssignmentDialog}>Cancel</Button>
          <Button onClick={handleAssignRoles} variant="contained">
            Assign Roles
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Permission Assignment Dialog */}
      <Dialog open={permissionAssignmentDialogOpen} onClose={closePermissionAssignmentDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Assign Permissions to {assignmentUser?.username}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
            Permissions
          </Typography>
          
          {Object.entries(groupedPermissions).map(([taskName, taskPermissions]) => (
            <Box key={taskName} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{taskName}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {taskPermissions.map((permission) => (
                  <FormControlLabel
                    key={`${permission.task_name}:${permission.action}`}
                    control={
                      <Checkbox
                        checked={assignmentPermissions.some(
                          p => p.task_name === permission.task_name && p.action === permission.action
                        )}
                        onChange={(e) =>
                          handleRolePermissionChange(
                            permission.task_name,
                            permission.action,
                            e.target.checked
                          )
                        }
                      />
                    }
                    label={permission.action}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePermissionAssignmentDialog}>Cancel</Button>
          <Button onClick={handleAssignPermissions} variant="contained">
            Assign Permissions
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AdministrationPanel;