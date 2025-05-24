import nock from 'nock';
import { OllamaClient } from '../src/ollama-client';
import { 
  OllamaConnectionError, 
  OllamaModelError, 
  OllamaValidationError 
} from '../src/errors';

describe('OllamaClient (Isolated Tests)', () => {
  let client: OllamaClient;
  const baseUrl = 'http://localhost:11434';

  beforeEach(() => {
    client = new OllamaClient(baseUrl);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Basic Functionality', () => {
    it('should list models successfully', async () => {
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
    });

    it('should generate text successfully', async () => {
      const generateRequest = {
        model: 'llama3.2',
        prompt: 'Hello world',
        stream: false
      };

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

    it('should handle chat successfully', async () => {
      const chatRequest = {
        model: 'llama3.2',
        messages: [
          { role: 'user' as const, content: 'Hello' }
        ],
        stream: false
      };

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
  });

  describe('Error Handling', () => {
    it('should throw OllamaConnectionError when server is unreachable', async () => {
      nock(baseUrl)
        .get('/api/tags')
        .replyWithError({ code: 'ECONNREFUSED' });

      await expect(client.listModels()).rejects.toThrow(OllamaConnectionError);
      await expect(client.listModels()).rejects.toThrow('Cannot connect to Ollama server');
    });

    it('should throw OllamaModelError on HTTP 404', async () => {
      // Set up the mock to intercept the exact request
      const scope = nock(baseUrl)
        .post('/api/generate', {
          model: 'nonexistent-model',
          prompt: 'test',
          stream: false
        })
        .reply(404, { error: 'model not found' });

      const request = {
        model: 'nonexistent-model',
        prompt: 'test',
        stream: false
      };

      await expect(client.generate(request)).rejects.toThrow(OllamaModelError);
      
      // Verify the mock was called
      expect(scope.isDone()).toBe(true);
    });

    it('should handle health check correctly', async () => {
      // Healthy server
      nock(baseUrl)
        .get('/')
        .reply(200, 'Ollama is running');

      let isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(true);

      // Unhealthy server
      nock(baseUrl)
        .get('/')
        .replyWithError({ code: 'ECONNREFUSED' });

      isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Model Management', () => {
    it('should pull model successfully', async () => {
      nock(baseUrl)
        .post('/api/pull', { name: 'llama3.2' })
        .reply(200, { status: 'success' });

      await expect(client.pullModel('llama3.2')).resolves.not.toThrow();
    });

    it('should show model info successfully', async () => {
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

    it('should delete model successfully', async () => {
      nock(baseUrl)
        .delete('/api/delete')
        .reply(200, { status: 'success' });

      await expect(client.deleteModel('llama3.2')).resolves.not.toThrow();
    });
  });
});