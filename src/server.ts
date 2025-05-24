import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ImageContent
} from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient } from './ollama-client.js';
import { 
  OllamaGenerateRequestSchema, 
  OllamaChatRequestSchema,
  OllamaChatMessage 
} from './types.js';
import { 
  OllamaError, 
  OllamaConnectionError, 
  OllamaModelError,
  MCPServerError 
} from './errors.js';

export class OllamaMCPServer {
  private server: Server;
  private ollamaClient: OllamaClient;

  constructor(ollamaUrl?: string) {
    this.server = new Server(
      {
        name: 'ollama-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.ollamaClient = new OllamaClient(ollamaUrl);
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ollama_list_models',
            description: 'List all available Ollama models on the local machine',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'ollama_generate',
            description: 'Generate text completion using an Ollama model',
            inputSchema: {
              type: 'object',
              properties: {
                model: { type: 'string', description: 'The name of the model to use' },
                prompt: { type: 'string', description: 'The prompt to generate from' },
                system: { type: 'string', description: 'System message to set context' },
                options: { 
                  type: 'object', 
                  description: 'Model parameters like temperature, top_p, etc.',
                  additionalProperties: true
                },
                stream: { type: 'boolean', description: 'Whether to stream the response', default: false }
              },
              required: ['model', 'prompt']
            }
          },
          {
            name: 'ollama_chat',
            description: 'Have a conversation with an Ollama model',
            inputSchema: {
              type: 'object',
              properties: {
                model: { type: 'string', description: 'The name of the model to use' },
                messages: {
                  type: 'array',
                  description: 'Array of conversation messages',
                  items: {
                    type: 'object',
                    properties: {
                      role: { type: 'string', enum: ['system', 'user', 'assistant', 'tool'] },
                      content: { type: 'string', description: 'Message content' }
                    },
                    required: ['role', 'content']
                  }
                },
                options: { 
                  type: 'object', 
                  description: 'Model parameters like temperature, top_p, etc.',
                  additionalProperties: true
                },
                stream: { type: 'boolean', description: 'Whether to stream the response', default: false }
              },
              required: ['model', 'messages']
            }
          },
          {
            name: 'ollama_pull_model',
            description: 'Download/pull a model from Ollama registry',
            inputSchema: {
              type: 'object',
              properties: {
                model: { type: 'string', description: 'The name of the model to pull (e.g., llama3.2, mistral)' }
              },
              required: ['model']
            }
          },
          {
            name: 'ollama_show_model',
            description: 'Show detailed information about a specific model',
            inputSchema: {
              type: 'object',
              properties: {
                model: { type: 'string', description: 'The name of the model to show info for' }
              },
              required: ['model']
            }
          },
          {
            name: 'ollama_delete_model',
            description: 'Delete a model from the local machine',
            inputSchema: {
              type: 'object',
              properties: {
                model: { type: 'string', description: 'The name of the model to delete' }
              },
              required: ['model']
            }
          },
          {
            name: 'ollama_health_check',
            description: 'Check if Ollama server is running and accessible',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ollama_list_models': {
            const models = await this.ollamaClient.listModels();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    models: models.map(model => ({
                      name: model.name,
                      size: model.size,
                      modified_at: model.modified_at,
                      family: model.details.family,
                      parameter_size: model.details.parameter_size
                    }))
                  }, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          case 'ollama_generate': {
            const request = OllamaGenerateRequestSchema.parse(args);
            const response = await this.ollamaClient.generate(request);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    response: response.response,
                    model: response.model,
                    done: response.done,
                    eval_count: response.eval_count,
                    eval_duration: response.eval_duration
                  }, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          case 'ollama_chat': {
            const request = OllamaChatRequestSchema.parse(args);
            const response = await this.ollamaClient.chat(request);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: response.message,
                    model: response.model,
                    done: response.done,
                    eval_count: response.eval_count,
                    eval_duration: response.eval_duration
                  }, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          case 'ollama_pull_model': {
            const { model } = args as { model: string };
            await this.ollamaClient.pullModel(model);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: `Model ${model} pulled successfully`
                  }, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          case 'ollama_show_model': {
            const { model } = args as { model: string };
            const info = await this.ollamaClient.showModel(model);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(info, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          case 'ollama_delete_model': {
            const { model } = args as { model: string };
            await this.ollamaClient.deleteModel(model);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: `Model ${model} deleted successfully`
                  }, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          case 'ollama_health_check': {
            const isHealthy = await this.ollamaClient.checkHealth();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    healthy: isHealthy,
                    server_url: this.ollamaClient.getBaseUrl(),
                    message: isHealthy ? 'Ollama server is running' : 'Ollama server is not accessible'
                  }, null, 2)
                } as TextContent
              ]
            } as CallToolResult;
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        let errorMessage: string;
        let errorType: string;

        if (error instanceof OllamaConnectionError) {
          errorMessage = error.message;
          errorType = 'connection_error';
        } else if (error instanceof OllamaModelError) {
          errorMessage = error.message;
          errorType = 'model_error';
        } else if (error instanceof OllamaError) {
          errorMessage = error.message;
          errorType = 'ollama_error';
        } else {
          errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          errorType = 'unknown_error';
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                error_type: errorType,
                message: errorMessage,
                tool: name
              }, null, 2)
            } as TextContent
          ],
          isError: true
        } as CallToolResult;
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Ollama MCP server running on stdio');
  }
}