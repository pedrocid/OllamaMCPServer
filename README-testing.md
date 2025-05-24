# Testing Guide

## Test Suite Overview

The Ollama MCP Server includes a comprehensive test suite that verifies all functionality:

### Test Categories

1. **Unit Tests** (`tests/ollama-client.test.ts`, `tests/ollama-client-only.test.ts`)
   - OllamaClient functionality
   - HTTP request/response handling
   - Error handling and validation

2. **Type Validation Tests** (`tests/types.test.ts`)
   - Zod schema validation
   - Type safety verification
   - Input/output data validation

3. **Error Handling Tests** (`tests/errors.test.ts`)
   - Custom error classes
   - Error inheritance
   - Error serialization

4. **Integration Tests** (`tests/integration.test.ts`)
   - Full workflow testing
   - MCP server tool execution
   - End-to-end scenarios

5. **Mock Infrastructure** (`tests/test-helpers.ts`)
   - Mock Ollama server
   - Test utilities
   - Helper functions

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test File
```bash
npx jest tests/ollama-client-only.test.ts
```

## Test Configuration

- **Jest** for test running
- **ts-jest** for TypeScript compilation
- **nock** for HTTP mocking
- **express** for mock server

## Mock Ollama Server

The test suite includes a full mock Ollama server that simulates:
- Model listing
- Text generation
- Chat conversations
- Model management operations
- Error scenarios

## Coverage Goals

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Test Patterns

### HTTP Mocking with Nock
```typescript
nock(baseUrl)
  .get('/api/tags')
  .reply(200, mockResponse);
```

### Error Testing
```typescript
await expect(client.listModels()).rejects.toThrow(OllamaConnectionError);
```

### Type Validation
```typescript
const result = OllamaModelSchema.parse(validModel);
expect(result).toEqual(validModel);
```

## Troubleshooting

### ES Module Issues
If you encounter ES module import errors, ensure:
- Jest configuration includes proper transform settings
- Module name mapping is correct
- TypeScript paths are resolved properly

### Network Timeouts
Mock server tests should complete quickly. If tests timeout:
- Check nock cleanup in afterEach
- Verify mock setup matches request patterns
- Ensure no real network requests are made

### Type Errors
For TypeScript compilation errors:
- Run `npm run typecheck` first
- Verify all types are properly imported
- Check Zod schema definitions match usage

## Adding New Tests

1. **Unit Tests**: Add to appropriate existing file or create new one
2. **Integration Tests**: Add to `integration.test.ts`
3. **Type Tests**: Add to `types.test.ts`
4. **Error Tests**: Add to `errors.test.ts`

Follow existing patterns and ensure tests are:
- Isolated (no dependencies between tests)
- Deterministic (same result every time)
- Fast (complete in milliseconds)
- Clear (descriptive test names and assertions)