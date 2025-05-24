// Global test setup
import nock from 'nock';

beforeEach(() => {
  // Clean up any pending mocks
  nock.cleanAll();
});

afterAll(() => {
  // Restore HTTP interceptors
  nock.restore();
});