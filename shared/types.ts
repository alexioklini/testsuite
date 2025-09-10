export interface TestSuite {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: number;
  suite_id: number;
  area: string;
  short_name: string;
  manual_tasks: string;
  expected_results: string;
  is_mandatory: boolean;
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  real_name?: string;
  email?: string;
  phone_number?: string;
  is_2fa_enabled: boolean;
  created_at: string;
}

export interface Application {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Version {
  id: number;
  application_id: number;
  version_number: string;
  created_at: string;
  updated_at: string;
}

export interface SuiteExecution {
  id: number;
  suite_id: number;
  execution_name: string;
  tester_name: string;
  application_id: number;
  version_id: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
}

export interface TestExecution {
  id: number;
  suite_execution_id: number;
  test_id: number;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'not_tested';
  result_notes: string;
  executed_at: string;
  // Test details (from JOIN with tests table)
  short_name?: string;
  area?: string;
  manual_tasks?: string;
  expected_results?: string;
  is_mandatory?: boolean;
}

export interface TestExecutionFile {
  id: number;
  test_execution_id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}