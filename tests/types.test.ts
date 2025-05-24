import { ZodError } from 'zod';
import {
  OllamaModelSchema,
  OllamaGenerateRequestSchema,
  OllamaChatRequestSchema,
  OllamaChatMessageSchema,
  OllamaListModelsResponseSchema,
  OllamaGenerateResponseSchema,
  OllamaChatResponseSchema
} from '../src/types';

describe('Type Validation', () => {
  describe('OllamaModelSchema', () => {
    it('should validate a complete model object', () => {
      const validModel = {
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
      };

      const result = OllamaModelSchema.parse(validModel);
      expect(result).toEqual(validModel);
    });

    it('should validate model with optional families field', () => {
      const modelWithoutFamilies = {
        name: 'mistral:latest',
        model: 'mistral',
        modified_at: '2024-01-01T00:00:00Z',
        size: 3500000000,
        digest: 'sha256:def456',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'mistral',
          parameter_size: '7B',
          quantization_level: 'Q4_0'
        }
      };

      expect(() => OllamaModelSchema.parse(modelWithoutFamilies)).not.toThrow();
    });

    it('should reject model with missing required fields', () => {
      const invalidModel = {
        name: 'incomplete-model',
        // missing required fields
      };

      expect(() => OllamaModelSchema.parse(invalidModel)).toThrow(ZodError);
    });

    it('should reject model with invalid types', () => {
      const invalidModel = {
        name: 'llama3.2',
        model: 'llama3.2',
        modified_at: '2024-01-01T00:00:00Z',
        size: 'not-a-number', // should be number
        digest: 'sha256:abc123',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'llama',
          parameter_size: '7B',
          quantization_level: 'Q4_0'
        }
      };

      expect(() => OllamaModelSchema.parse(invalidModel)).toThrow(ZodError);
    });
  });

  describe('OllamaGenerateRequestSchema', () => {
    it('should validate minimal generate request', () => {
      const validRequest = {
        model: 'llama3.2',
        prompt: 'Hello world'
      };

      const result = OllamaGenerateRequestSchema.parse(validRequest);
      expect(result.model).toBe('llama3.2');
      expect(result.prompt).toBe('Hello world');
      expect(result.stream).toBe(false); // default value
    });

    it('should validate complete generate request', () => {
      const completeRequest = {
        model: 'llama3.2',
        prompt: 'Hello world',
        images: ['base64-image-data'],
        format: 'json',
        options: { temperature: 0.7, top_p: 0.9 },
        system: 'You are a helpful assistant',
        template: 'Custom template',
        context: [1, 2, 3, 4, 5],
        stream: true,
        raw: false,
        keep_alive: '5m'
      };

      const result = OllamaGenerateRequestSchema.parse(completeRequest);
      expect(result).toEqual(completeRequest);
    });

    it('should reject request without required fields', () => {
      const invalidRequest = {
        model: 'llama3.2'
        // missing prompt
      };

      expect(() => OllamaGenerateRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });

    it('should reject request with invalid types', () => {
      const invalidRequest = {
        model: 'llama3.2',
        prompt: 'Hello',
        stream: 'yes' // should be boolean
      };

      expect(() => OllamaGenerateRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });
  });

  describe('OllamaChatMessageSchema', () => {
    it('should validate user message', () => {
      const userMessage = {
        role: 'user',
        content: 'Hello, how are you?'
      };

      const result = OllamaChatMessageSchema.parse(userMessage);
      expect(result.role).toBe('user');
      expect(result.content).toBe('Hello, how are you?');
    });

    it('should validate assistant message', () => {
      const assistantMessage = {
        role: 'assistant',
        content: 'I am doing well, thank you!'
      };

      const result = OllamaChatMessageSchema.parse(assistantMessage);
      expect(result.role).toBe('assistant');
      expect(result.content).toBe('I am doing well, thank you!');
    });

    it('should validate system message', () => {
      const systemMessage = {
        role: 'system',
        content: 'You are a helpful assistant'
      };

      const result = OllamaChatMessageSchema.parse(systemMessage);
      expect(result.role).toBe('system');
      expect(result.content).toBe('You are a helpful assistant');
    });

    it('should validate tool message', () => {
      const toolMessage = {
        role: 'tool',
        content: 'Tool execution result'
      };

      const result = OllamaChatMessageSchema.parse(toolMessage);
      expect(result.role).toBe('tool');
      expect(result.content).toBe('Tool execution result');
    });

    it('should validate message with optional fields', () => {
      const messageWithImages = {
        role: 'user',
        content: 'What do you see in this image?',
        images: ['base64-image-1', 'base64-image-2'],
        tool_calls: [{ id: 'call1', type: 'function' }]
      };

      const result = OllamaChatMessageSchema.parse(messageWithImages);
      expect(result.images).toHaveLength(2);
      expect(result.tool_calls).toHaveLength(1);
    });

    it('should reject message with invalid role', () => {
      const invalidMessage = {
        role: 'invalid-role',
        content: 'Hello'
      };

      expect(() => OllamaChatMessageSchema.parse(invalidMessage)).toThrow(ZodError);
    });
  });

  describe('OllamaChatRequestSchema', () => {
    it('should validate minimal chat request', () => {
      const validRequest = {
        model: 'llama3.2',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const result = OllamaChatRequestSchema.parse(validRequest);
      expect(result.model).toBe('llama3.2');
      expect(result.messages).toHaveLength(1);
      expect(result.stream).toBe(false); // default value
    });

    it('should validate complete chat request', () => {
      const completeRequest = {
        model: 'llama3.2',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello' }
        ],
        tools: [{ name: 'calculator', description: 'Math tool' }],
        format: 'json',
        options: { temperature: 0.7 },
        stream: true,
        keep_alive: '10m'
      };

      const result = OllamaChatRequestSchema.parse(completeRequest);
      expect(result).toEqual(completeRequest);
    });

    it('should reject request with empty messages array', () => {
      const invalidRequest = {
        model: 'llama3.2',
        messages: []
      };

      expect(() => OllamaChatRequestSchema.parse(invalidRequest)).toThrow(ZodError);
    });
  });

  describe('OllamaListModelsResponseSchema', () => {
    it('should validate models list response', () => {
      const validResponse = {
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
              parameter_size: '7B',
              quantization_level: 'Q4_0'
            }
          }
        ]
      };

      const result = OllamaListModelsResponseSchema.parse(validResponse);
      expect(result.models).toHaveLength(1);
      expect(result.models[0].name).toBe('llama3.2:latest');
    });

    it('should validate empty models list', () => {
      const emptyResponse = { models: [] };
      
      const result = OllamaListModelsResponseSchema.parse(emptyResponse);
      expect(result.models).toHaveLength(0);
    });
  });

  describe('OllamaGenerateResponseSchema', () => {
    it('should validate complete generate response', () => {
      const validResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        response: 'Generated text response',
        done: true,
        context: [1, 2, 3, 4, 5],
        total_duration: 1000000000,
        load_duration: 100000000,
        prompt_eval_count: 5,
        prompt_eval_duration: 200000000,
        eval_count: 10,
        eval_duration: 300000000
      };

      const result = OllamaGenerateResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate minimal generate response', () => {
      const minimalResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        response: 'Text',
        done: true
      };

      const result = OllamaGenerateResponseSchema.parse(minimalResponse);
      expect(result.model).toBe('llama3.2');
      expect(result.done).toBe(true);
    });
  });

  describe('OllamaChatResponseSchema', () => {
    it('should validate complete chat response', () => {
      const validResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you?'
        },
        done: true,
        total_duration: 1000000000,
        load_duration: 100000000,
        prompt_eval_count: 5,
        prompt_eval_duration: 200000000,
        eval_count: 10,
        eval_duration: 300000000
      };

      const result = OllamaChatResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate minimal chat response', () => {
      const minimalResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Response'
        },
        done: true
      };

      const result = OllamaChatResponseSchema.parse(minimalResponse);
      expect(result.message.role).toBe('assistant');
      expect(result.done).toBe(true);
    });
  });

  describe('Cross-schema Validation', () => {
    it('should validate that chat request messages match message schema', () => {
      const chatRequest = {
        model: 'llama3.2',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'invalid-role', content: 'This should fail' }
        ]
      };

      expect(() => OllamaChatRequestSchema.parse(chatRequest)).toThrow(ZodError);
    });

    it('should validate that response message matches message schema', () => {
      const chatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'invalid-role', // This should fail
          content: 'Response'
        },
        done: true
      };

      expect(() => OllamaChatResponseSchema.parse(chatResponse)).toThrow(ZodError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const modelWithLargeSize = {
        name: 'huge-model',
        model: 'huge',
        modified_at: '2024-01-01T00:00:00Z',
        size: Number.MAX_SAFE_INTEGER,
        digest: 'sha256:huge',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'huge',
          parameter_size: '1T',
          quantization_level: 'FP16'
        }
      };

      expect(() => OllamaModelSchema.parse(modelWithLargeSize)).not.toThrow();
    });

    it('should handle empty strings appropriately', () => {
      const requestWithEmptyPrompt = {
        model: 'llama3.2',
        prompt: ''
      };

      // Empty prompt should be valid (some use cases might need it)
      expect(() => OllamaGenerateRequestSchema.parse(requestWithEmptyPrompt)).not.toThrow();
    });

    it('should handle unicode content', () => {
      const unicodeMessage = {
        role: 'user',
        content: '🤖 Hello, AI! Can you help me with 数学 problems? Здравствуй!'
      };

      const result = OllamaChatMessageSchema.parse(unicodeMessage);
      expect(result.content).toContain('🤖');
      expect(result.content).toContain('数学');
      expect(result.content).toContain('Здравствуй');
    });
  });
});