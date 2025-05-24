import nock from 'nock';
import { OllamaClient } from '../src/ollama-client';
import { 
  OllamaConnectionError, 
  OllamaModelError, 
  OllamaValidationError 
} from '../src/errors';

describe('OllamaClient', () => {
  let client: OllamaClient;
  const baseUrl = 'http://localhost:11434';

  beforeEach(() => {
    client = new OllamaClient(baseUrl);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('constructor', () => {
    it('should use default URL when none provided', () => {
      const defaultClient = new OllamaClient();
      expect(defaultClient.getBaseUrl()).toBe('http://localhost:11434');
    });

    it('should use provided URL', () => {
      const customClient = new OllamaClient('http://custom:8080');
      expect(customClient.getBaseUrl()).toBe('http://custom:8080');
    });
  });

  describe('listModels', () => {
    it('should return list of models successfully', async () => {
      const mockResponse = {
        models: [
          {
            name: 'llama3.2:latest',
            model: 'llama3.2',
            modified_at: '2024-01-01T00:00:00Z',
            size: 4000000000,
            digest: 'sha256:abc123',
            details: {
              parent_model: '',
              format: 'gguf',
              family: 'llama',
              families: ['llama'],
              parameter_size: '7B',
              quantization_level: 'Q4_0'
            }
          }
        ]
      };

      nock(baseUrl)
        .get('/api/tags')
        .reply(200, mockResponse);

      const models = await client.listModels();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('llama3.2:latest');
      expect(models[0].details.family).toBe('llama');
    });

    it('should throw OllamaConnectionError when server is unreachable', async () => {
      nock(baseUrl)
        .get('/api/tags')
        .replyWithError({ code: 'ECONNREFUSED' });

      await expect(client.listModels()).rejects.toThrow(OllamaConnectionError);
      await expect(client.listModels()).rejects.toThrow('Cannot connect to Ollama server');
    });

    it('should throw OllamaModelError on HTTP error', async () => {
      nock(baseUrl)
        .get('/api/tags')
        .reply(500, { error: 'Internal server error' });

      await expect(client.listModels()).rejects.toThrow(OllamaModelError);
    });

    it('should throw OllamaValidationError on invalid response', async () => {
      nock(baseUrl)
        .get('/api/tags')
        .reply(200, { invalid: 'response' });

      await expect(client.listModels()).rejects.toThrow(OllamaValidationError);
    });
  });

  describe('generate', () => {
    const generateRequest = {
      model: 'llama3.2',
      prompt: 'Hello world',
      stream: false
    };

    it('should generate text successfully', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        response: 'Hello! How can I help you today?',
        done: true,
        context: [1, 2, 3],
        total_duration: 1000000000,
        load_duration: 100000000,
        prompt_eval_count: 5,
        prompt_eval_duration: 200000000,
        eval_count: 10,
        eval_duration: 300000000
      };

      nock(baseUrl)
        .post('/api/generate', generateRequest)
        .reply(200, mockResponse);

      const response = await client.generate(generateRequest);
      expect(response.response).toBe('Hello! How can I help you today?');
      expect(response.done).toBe(true);
      expect(response.model).toBe('llama3.2');
    });

    it('should throw OllamaModelError when model not found', async () => {
      nock(baseUrl)
        .post('/api/generate')
        .reply(404, { error: 'model not found' });

      await expect(client.generate(generateRequest)).rejects.toThrow(OllamaModelError);
      await expect(client.generate(generateRequest)).rejects.toThrow("Model 'llama3.2' not found");
    });

    it('should throw OllamaConnectionError when server unreachable', async () => {
      nock(baseUrl)
        .post('/api/generate')
        .replyWithError({ code: 'ECONNREFUSED' });

      await expect(client.generate(generateRequest)).rejects.toThrow(OllamaConnectionError);
    });
  });

  describe('chat', () => {
    const chatRequest = {
      model: 'llama3.2',
      messages: [
        { role: 'user' as const, content: 'Hello' }
      ],
      stream: false
    };

    it('should chat successfully', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you?'
        },
        done: true,
        total_duration: 1000000000,
        eval_count: 8,
        eval_duration: 400000000
      };

      nock(baseUrl)
        .post('/api/chat', chatRequest)
        .reply(200, mockResponse);

      const response = await client.chat(chatRequest);
      expect(response.message.content).toBe('Hello! How can I help you?');
      expect(response.message.role).toBe('assistant');
      expect(response.done).toBe(true);
    });

    it('should throw OllamaModelError when model not found', async () => {
      nock(baseUrl)
        .post('/api/chat')
        .reply(404, { error: 'model not found' });

      await expect(client.chat(chatRequest)).rejects.toThrow(OllamaModelError);
    });
  });

  describe('checkHealth', () => {
    it('should return true when server is healthy', async () => {
      nock(baseUrl)
        .get('/')
        .reply(200, 'Ollama is running');

      const isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(true);
    });

    it('should return false when server is unreachable', async () => {
      nock(baseUrl)
        .get('/')
        .replyWithError({ code: 'ECONNREFUSED' });

      const isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(false);
    });

    it('should return false on HTTP error', async () => {
      nock(baseUrl)
        .get('/')
        .reply(500, 'Internal Server Error');

      const isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(false);
    });
  });

  describe('pullModel', () => {
    it('should pull model successfully', async () => {
      nock(baseUrl)
        .post('/api/pull', { name: 'llama3.2' })
        .reply(200, { status: 'success' });

      await expect(client.pullModel('llama3.2')).resolves.not.toThrow();
    });

    it('should throw error on failure', async () => {
      nock(baseUrl)
        .post('/api/pull')
        .reply(500, { error: 'Pull failed' });

      await expect(client.pullModel('invalid-model')).rejects.toThrow('Failed to pull model');
    });
  });

  describe('showModel', () => {
    it('should return model information successfully', async () => {
      const mockModelInfo = {
        modelfile: 'FROM llama3.2',
        parameters: 'temperature 0.8',
        template: '{{ .Prompt }}',
        details: {
          family: 'llama',
          parameter_size: '7B'
        }
      };

      nock(baseUrl)
        .post('/api/show', { name: 'llama3.2' })
        .reply(200, mockModelInfo);

      const info = await client.showModel('llama3.2');
      expect(info.details.family).toBe('llama');
      expect(info.details.parameter_size).toBe('7B');
    });

    it('should throw error when model not found', async () => {
      nock(baseUrl)
        .post('/api/show')
        .reply(404, { error: 'model not found' });

      await expect(client.showModel('nonexistent')).rejects.toThrow('Failed to show model');
    });
  });

  describe('deleteModel', () => {
    it('should delete model successfully', async () => {
      nock(baseUrl)
        .delete('/api/delete')
        .reply(200, { status: 'success' });

      await expect(client.deleteModel('llama3.2')).resolves.not.toThrow();
    });

    it('should throw error on failure', async () => {
      nock(baseUrl)
        .delete('/api/delete')
        .reply(404, { error: 'model not found' });

      await expect(client.deleteModel('nonexistent')).rejects.toThrow('Failed to delete model');
    });
  });
});