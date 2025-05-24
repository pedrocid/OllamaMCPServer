export class OllamaError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'OllamaError';
  }
}

export class OllamaConnectionError extends OllamaError {
  constructor(message: string = 'Failed to connect to Ollama server', cause?: Error) {
    super(message, cause);
    this.name = 'OllamaConnectionError';
  }
}

export class OllamaModelError extends OllamaError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'OllamaModelError';
  }
}

export class OllamaValidationError extends OllamaError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'OllamaValidationError';
  }
}

export class MCPServerError extends Error {
  constructor(message: string, public readonly toolName?: string, cause?: Error) {
    super(message);
    this.name = 'MCPServerError';
    this.cause = cause;
  }
}