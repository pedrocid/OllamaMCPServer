import { OllamaClient } from '../src/ollama-client';
import { OllamaMCPServer } from '../src/server';
import { MockOllamaServer } from './test-helpers';

describe('Integration Tests', () => {
  let mockServer: MockOllamaServer;
  let client: OllamaClient;
  let mcpServer: OllamaMCPServer;

  beforeAll(async () => {
    mockServer = new MockOllamaServer(11435);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    client = new OllamaClient(mockServer.getUrl());
    mcpServer = new OllamaMCPServer(mockServer.getUrl());
  });

  describe('Full Workflow Tests', () => {
    it('should complete a full model listing workflow', async () => {
      // Test direct client call
      const models = await client.listModels();
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('llama3.2:latest');
      expect(models[1].name).toBe('mistral:latest');

      // Test via MCP server
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const mcpResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_list_models',
          arguments: {}
        }
      });

      const mcpData = JSON.parse(mcpResult.content[0].text);
      expect(mcpData.models).toHaveLength(2);
      expect(mcpData.models[0].name).toBe('llama3.2:latest');
    });

    it('should complete a full text generation workflow', async () => {
      const prompt = 'Tell me about artificial intelligence';
      
      // Test direct client call
      const directResponse = await client.generate({
        model: 'llama3.2',
        prompt,
        stream: false
      });

      expect(directResponse.response).toContain(prompt);
      expect(directResponse.model).toBe('llama3.2');
      expect(directResponse.done).toBe(true);

      // Test via MCP server
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const mcpResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_generate',
          arguments: {
            model: 'llama3.2',
            prompt,
            options: { temperature: 0.7 }
          }
        }
      });

      const mcpData = JSON.parse(mcpResult.content[0].text);
      expect(mcpData.response).toContain(prompt);
      expect(mcpData.model).toBe('llama3.2');
    });

    it('should complete a full chat workflow', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello, how are you?' }
      ];

      // Test direct client call
      const directResponse = await client.chat({
        model: 'mistral',
        messages,
        stream: false
      });

      expect(directResponse.message.role).toBe('assistant');
      expect(directResponse.message.content).toContain('Hello, how are you?');
      expect(directResponse.model).toBe('mistral');

      // Test via MCP server
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const mcpResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_chat',
          arguments: {
            model: 'mistral',
            messages
          }
        }
      });

      const mcpData = JSON.parse(mcpResult.content[0].text);
      expect(mcpData.message.content).toContain('Hello, how are you?');
      expect(mcpData.model).toBe('mistral');
    });

    it('should handle model management workflow', async () => {
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');

      // Test show model
      const showResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_show_model',
          arguments: { model: 'llama3.2' }
        }
      });

      const showData = JSON.parse(showResult.content[0].text);
      expect(showData.details.family).toBe('llama');
      expect(showData.details.parameter_size).toBe('7B');

      // Test pull model
      const pullResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_pull_model',
          arguments: { model: 'new-model' }
        }
      });

      const pullData = JSON.parse(pullResult.content[0].text);
      expect(pullData.success).toBe(true);
      expect(pullData.message).toContain('new-model');

      // Test delete model
      const deleteResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_delete_model',
          arguments: { model: 'old-model' }
        }
      });

      const deleteData = JSON.parse(deleteResult.content[0].text);
      expect(deleteData.success).toBe(true);
      expect(deleteData.message).toContain('old-model');
    });

    it('should handle health check workflow', async () => {
      // Test direct client call
      const isHealthy = await client.checkHealth();
      expect(isHealthy).toBe(true);

      // Test via MCP server
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const mcpResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_health_check',
          arguments: {}
        }
      });

      const mcpData = JSON.parse(mcpResult.content[0].text);
      expect(mcpData.healthy).toBe(true);
      expect(mcpData.server_url).toBe(mockServer.getUrl());
      expect(mcpData.message).toBe('Ollama server is running');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle nonexistent model errors consistently', async () => {
      const nonexistentModel = 'nonexistent-model';
      
      // Test direct client error
      await expect(client.generate({
        model: nonexistentModel,
        prompt: 'test',
        stream: false
      })).rejects.toThrow('Model \'nonexistent-model\' not found');

      // Test MCP server error
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const mcpResult = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_generate',
          arguments: {
            model: nonexistentModel,
            prompt: 'test'
          }
        }
      });

      expect(mcpResult.isError).toBe(true);
      const errorData = JSON.parse(mcpResult.content[0].text);
      expect(errorData.error_type).toBe('model_error');
      expect(errorData.message).toContain('nonexistent-model');
    });

    it('should handle invalid model pull requests', async () => {
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_pull_model',
          arguments: { model: 'invalid-model' }
        }
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error_type).toBe('ollama_error');
      expect(errorData.message).toContain('Failed to pull model');
    });

    it('should handle show model for nonexistent model', async () => {
      const callToolHandler = (mcpServer as any).server.requestHandlers.get('tools/call');
      const result = await callToolHandler({
        method: 'tools/call',
        params: {
          name: 'ollama_show_model',
          arguments: { model: 'nonexistent-model' }
        }
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error_type).toBe('ollama_error');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        client.generate({
          model: 'llama3.2',
          prompt: `Test prompt ${i}`,
          stream: false
        })
      );

      const results = await Promise.all(promises);
      
      results.forEach((result, i) => {
        expect(result.response).toContain(`Test prompt ${i}`);
        expect(result.model).toBe('llama3.2');
        expect(result.done).toBe(true);
      });
    });

    it('should handle requests with various options', async () => {
      const response = await client.generate({
        model: 'llama3.2',
        prompt: 'Test with options',
        system: 'You are a helpful assistant',
        options: {
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 100
        },
        stream: false
      });

      expect(response.response).toContain('Test with options');
      expect(response.model).toBe('llama3.2');
    });

    it('should handle complex chat conversations', async () => {
      const conversation = [
        { role: 'system' as const, content: 'You are a helpful coding assistant' },
        { role: 'user' as const, content: 'How do I reverse a string in Python?' },
        { role: 'assistant' as const, content: 'You can use string slicing: my_string[::-1]' },
        { role: 'user' as const, content: 'Can you show me an example?' }
      ];

      const response = await client.chat({
        model: 'llama3.2',
        messages: conversation,
        stream: false
      });

      expect(response.message.role).toBe('assistant');
      expect(response.message.content).toContain('Can you show me an example?');
      expect(response.model).toBe('llama3.2');
    });
  });
});