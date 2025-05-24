import nock from 'nock';
import { OllamaMCPServer } from '../src/server';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Mock stdio transport
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    // Mock transport methods
  }))
}));

describe('OllamaMCPServer', () => {
  let server: OllamaMCPServer;
  const baseUrl = 'http://localhost:11434';

  beforeEach(() => {
    server = new OllamaMCPServer(baseUrl);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', async () => {
      // Access the server's request handler for ListTools
      const listToolsHandler = (server as any).server.requestHandlers.get('tools/list');
      expect(listToolsHandler).toBeDefined();

      const result = await listToolsHandler({ method: 'tools/list' });
      
      expect(result.tools).toHaveLength(7);
      
      const toolNames = result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('ollama_list_models');
      expect(toolNames).toContain('ollama_generate');
      expect(toolNames).toContain('ollama_chat');
      expect(toolNames).toContain('ollama_pull_model');
      expect(toolNames).toContain('ollama_show_model');
      expect(toolNames).toContain('ollama_delete_model');
      expect(toolNames).toContain('ollama_health_check');
    });

    it('should have correct tool schemas', async () => {
      const listToolsHandler = (server as any).server.requestHandlers.get('tools/list');
      const result = await listToolsHandler({ method: 'tools/list' });
      
      const generateTool = result.tools.find((tool: any) => tool.name === 'ollama_generate');
      expect(generateTool).toBeDefined();
      expect(generateTool.inputSchema.properties.model).toBeDefined();
      expect(generateTool.inputSchema.properties.prompt).toBeDefined();
      expect(generateTool.inputSchema.required).toContain('model');
      expect(generateTool.inputSchema.required).toContain('prompt');

      const chatTool = result.tools.find((tool: any) => tool.name === 'ollama_chat');
      expect(chatTool).toBeDefined();
      expect(chatTool.inputSchema.properties.messages).toBeDefined();
      expect(chatTool.inputSchema.required).toContain('model');
      expect(chatTool.inputSchema.required).toContain('messages');
    });
  });

  describe('Tool Execution - ollama_list_models', () => {
    it('should execute ollama_list_models successfully', async () => {
      const mockModels = {
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
        .reply(200, mockModels);

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_list_models',
          arguments: {}
        }
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.models).toHaveLength(1);
      expect(responseData.models[0].name).toBe('llama3.2:latest');
    });

    it('should handle connection error in ollama_list_models', async () => {
      nock(baseUrl)
        .get('/api/tags')
        .replyWithError({ code: 'ECONNREFUSED' });

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_list_models',
          arguments: {}
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe(true);
      expect(errorData.error_type).toBe('connection_error');
      expect(errorData.tool).toBe('ollama_list_models');
    });
  });

  describe('Tool Execution - ollama_generate', () => {
    it('should execute ollama_generate successfully', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        response: 'Hello! How can I help you today?',
        done: true,
        eval_count: 10,
        eval_duration: 300000000
      };

      nock(baseUrl)
        .post('/api/generate')
        .reply(200, mockResponse);

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_generate',
          arguments: {
            model: 'llama3.2',
            prompt: 'Hello world'
          }
        }
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.response).toBe('Hello! How can I help you today?');
      expect(responseData.model).toBe('llama3.2');
      expect(responseData.done).toBe(true);
    });

    it('should handle model not found error', async () => {
      nock(baseUrl)
        .post('/api/generate')
        .reply(404, { error: 'model not found' });

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_generate',
          arguments: {
            model: 'nonexistent-model',
            prompt: 'Hello'
          }
        }
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error_type).toBe('model_error');
      expect(errorData.message).toContain('nonexistent-model');
    });
  });

  describe('Tool Execution - ollama_chat', () => {
    it('should execute ollama_chat successfully', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you?'
        },
        done: true,
        eval_count: 8,
        eval_duration: 400000000
      };

      nock(baseUrl)
        .post('/api/chat')
        .reply(200, mockResponse);

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_chat',
          arguments: {
            model: 'llama3.2',
            messages: [
              { role: 'user', content: 'Hello' }
            ]
          }
        }
      });

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.message.content).toBe('Hello! How can I help you?');
      expect(responseData.message.role).toBe('assistant');
    });
  });

  describe('Tool Execution - ollama_health_check', () => {
    it('should execute ollama_health_check when server is healthy', async () => {
      nock(baseUrl)
        .get('/')
        .reply(200, 'Ollama is running');

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_health_check',
          arguments: {}
        }
      });

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.healthy).toBe(true);
      expect(responseData.server_url).toBe(baseUrl);
      expect(responseData.message).toBe('Ollama server is running');
    });

    it('should execute ollama_health_check when server is unhealthy', async () => {
      nock(baseUrl)
        .get('/')
        .replyWithError({ code: 'ECONNREFUSED' });

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_health_check',
          arguments: {}
        }
      });

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.healthy).toBe(false);
      expect(responseData.message).toBe('Ollama server is not accessible');
    });
  });

  describe('Tool Execution - ollama_pull_model', () => {
    it('should execute ollama_pull_model successfully', async () => {
      nock(baseUrl)
        .post('/api/pull', { name: 'llama3.2' })
        .reply(200, { status: 'success' });

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_pull_model',
          arguments: { model: 'llama3.2' }
        }
      });

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('llama3.2');
    });
  });

  describe('Tool Execution - ollama_show_model', () => {
    it('should execute ollama_show_model successfully', async () => {
      const mockModelInfo = {
        modelfile: 'FROM llama3.2',
        parameters: 'temperature 0.8',
        details: { family: 'llama' }
      };

      nock(baseUrl)
        .post('/api/show', { name: 'llama3.2' })
        .reply(200, mockModelInfo);

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_show_model',
          arguments: { model: 'llama3.2' }
        }
      });

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.details.family).toBe('llama');
    });
  });

  describe('Tool Execution - ollama_delete_model', () => {
    it('should execute ollama_delete_model successfully', async () => {
      nock(baseUrl)
        .delete('/api/delete')
        .reply(200, { status: 'success' });

      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_delete_model',
          arguments: { model: 'old-model' }
        }
      });

      expect(result.content).toHaveLength(1);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('old-model');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool name', async () => {
      const callToolHandler = (server as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error_type).toBe('unknown_error');
      expect(errorData.message).toContain('Unknown tool: unknown_tool');
    });
  });
});