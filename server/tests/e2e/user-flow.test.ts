import request from 'supertest';
import app from '../../server';

describe('User Flow', () => {
  let authToken: string;
  let suiteId: number;
  let testId: number;

  beforeAll(async () => {
    // Register and login a user to get auth token
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'e2euser',
        password: 'e2epass123',
        real_name: 'E2E User',
        email: 'e2e@example.com'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'e2euser',
        password: 'e2epass123'
      });

    authToken = loginResponse.body.token;
  });

  it('should create a test suite', async () => {
    const response = await request(app)
      .post('/api/test-suites')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Suite',
        description: 'Test suite created during E2E test'
      })
      .expect(200);

    expect(response.body.id).toBeDefined();
    suiteId = response.body.id;
  });

  it('should add a test to the suite', async () => {
    const response = await request(app)
      .post(`/api/test-suites/${suiteId}/tests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        area: 'E2E Testing',
        short_name: 'Sample Test',
        manual_tasks: 'Perform sample task',
        expected_results: 'Task completes successfully',
        is_mandatory: true
      })
      .expect(200);

    expect(response.body.id).toBeDefined();
    testId = response.body.id;
  });

  it('should start executing the test suite', async () => {
    // Create application and version first
    const appResponse = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E App',
        description: 'Application for E2E testing'
      })
      .expect(201);

    const appId = appResponse.body.id;

    const versionResponse = await request(app)
      .post('/api/versions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        application_id: appId,
        version_number: '1.0.0'
      })
      .expect(201);

    const versionId = versionResponse.body.id;

    // Start suite execution
    const response = await request(app)
      .post(`/api/test-suites/${suiteId}/start-execution`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        execution_name: 'E2E Execution',
        tester_name: 'E2E User',
        application_id: appId,
        version_id: versionId
      })
      .expect(200);

    expect(response.body.suite_execution_id).toBeDefined();
    expect(response.body.test_count).toBe(1);
  });

  it('should update test execution status', async () => {
    // Get suite execution ID
    const executionsResponse = await request(app)
      .get(`/api/test-suites/${suiteId}/executions`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const suiteExecutionId = executionsResponse.body[0].id;

    // Get test execution ID
    const testsResponse = await request(app)
      .get(`/api/suite-executions/${suiteExecutionId}/tests`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const testExecutionId = testsResponse.body[0].id;

    // Update test execution status
    const response = await request(app)
      .put(`/api/test-executions/${testExecutionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'passed',
        result_notes: 'Test passed during E2E flow'
      })
      .expect(200);

    expect(response.body.message).toBe('Test execution updated');
  });
});