import { 
  OllamaError,
  OllamaConnectionError,
  OllamaModelError,
  OllamaValidationError,
  MCPServerError
} from '../src/errors';

describe('Error Classes', () => {
  describe('OllamaError', () => {
    it('should create error with message', () => {
      const error = new OllamaError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('OllamaError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with message and cause', () => {
      const cause = new Error('Root cause');
      const error = new OllamaError('Test error', cause);
      expect(error.message).toBe('Test error');
      expect(error.cause).toBe(cause);
    });
  });

  describe('OllamaConnectionError', () => {
    it('should create connection error with default message', () => {
      const error = new OllamaConnectionError();
      expect(error.message).toBe('Failed to connect to Ollama server');
      expect(error.name).toBe('OllamaConnectionError');
      expect(error).toBeInstanceOf(OllamaError);
    });

    it('should create connection error with custom message', () => {
      const error = new OllamaConnectionError('Custom connection error');
      expect(error.message).toBe('Custom connection error');
      expect(error.name).toBe('OllamaConnectionError');
    });

    it('should create connection error with cause', () => {
      const cause = new Error('Network error');
      const error = new OllamaConnectionError('Connection failed', cause);
      expect(error.message).toBe('Connection failed');
      expect(error.cause).toBe(cause);
    });
  });

  describe('OllamaModelError', () => {
    it('should create model error with message', () => {
      const error = new OllamaModelError('Model not found');
      expect(error.message).toBe('Model not found');
      expect(error.name).toBe('OllamaModelError');
      expect(error).toBeInstanceOf(OllamaError);
    });

    it('should create model error with cause', () => {
      const cause = new Error('HTTP 404');
      const error = new OllamaModelError('Model error', cause);
      expect(error.message).toBe('Model error');
      expect(error.cause).toBe(cause);
    });
  });

  describe('OllamaValidationError', () => {
    it('should create validation error with message', () => {
      const error = new OllamaValidationError('Invalid response format');
      expect(error.message).toBe('Invalid response format');
      expect(error.name).toBe('OllamaValidationError');
      expect(error).toBeInstanceOf(OllamaError);
    });

    it('should create validation error with cause', () => {
      const cause = new Error('Schema validation failed');
      const error = new OllamaValidationError('Validation failed', cause);
      expect(error.message).toBe('Validation failed');
      expect(error.cause).toBe(cause);
    });
  });

  describe('MCPServerError', () => {
    it('should create MCP server error with message', () => {
      const error = new MCPServerError('MCP operation failed');
      expect(error.message).toBe('MCP operation failed');
      expect(error.name).toBe('MCPServerError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create MCP server error with tool name', () => {
      const error = new MCPServerError('Tool execution failed', 'ollama_generate');
      expect(error.message).toBe('Tool execution failed');
      expect(error.toolName).toBe('ollama_generate');
    });

    it('should create MCP server error with cause', () => {
      const cause = new OllamaConnectionError('Connection failed');
      const error = new MCPServerError('MCP error', 'ollama_chat', cause);
      expect(error.message).toBe('MCP error');
      expect(error.toolName).toBe('ollama_chat');
      expect(error.cause).toBe(cause);
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const connectionError = new OllamaConnectionError('Connection failed');
      const modelError = new OllamaModelError('Model error');
      const validationError = new OllamaValidationError('Validation error');

      // All Ollama errors should be instances of OllamaError
      expect(connectionError).toBeInstanceOf(OllamaError);
      expect(modelError).toBeInstanceOf(OllamaError);
      expect(validationError).toBeInstanceOf(OllamaError);

      // All should be instances of Error
      expect(connectionError).toBeInstanceOf(Error);
      expect(modelError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);

      // But specific types should not be instances of each other
      expect(connectionError).not.toBeInstanceOf(OllamaModelError);
      expect(modelError).not.toBeInstanceOf(OllamaConnectionError);
    });

    it('should have unique error names', () => {
      const errors = [
        new OllamaError('base'),
        new OllamaConnectionError('connection'),
        new OllamaModelError('model'),
        new OllamaValidationError('validation'),
        new MCPServerError('mcp')
      ];

      const names = errors.map(e => e.name);
      const uniqueNames = [...new Set(names)];
      
      expect(uniqueNames).toHaveLength(names.length);
      expect(names).toEqual([
        'OllamaError',
        'OllamaConnectionError', 
        'OllamaModelError',
        'OllamaValidationError',
        'MCPServerError'
      ]);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize errors properly', () => {
      const cause = new Error('Root cause');
      const error = new OllamaConnectionError('Connection failed', cause);

      // Test that error can be converted to string
      expect(error.toString()).toContain('OllamaConnectionError');
      expect(error.toString()).toContain('Connection failed');

      // Test that error properties are accessible
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('OllamaConnectionError');
      expect(error.cause).toBe(cause);
    });

    it('should handle JSON serialization', () => {
      const error = new OllamaModelError('Model not found');
      
      // Create a plain object representation
      const errorObj = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };

      const jsonString = JSON.stringify(errorObj);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe('OllamaModelError');
      expect(parsed.message).toBe('Model not found');
      expect(parsed.stack).toBeDefined();
    });
  });

  describe('Error Stack Traces', () => {
    it('should preserve stack traces', () => {
      const error = new OllamaConnectionError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('OllamaConnectionError');
      expect(error.stack).toContain('Test error');
    });

    it('should preserve cause stack traces', () => {
      const cause = new Error('Original error');
      const error = new OllamaModelError('Wrapped error', cause);
      
      expect(error.stack).toBeDefined();
      expect(error.cause).toBe(cause);
      expect(cause.stack).toBeDefined();
    });
  });
});