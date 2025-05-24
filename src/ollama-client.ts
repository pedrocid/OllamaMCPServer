import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  OllamaModel,
  OllamaGenerateRequest,
  OllamaChatRequest,
  OllamaListModelsResponse,
  OllamaGenerateResponse,
  OllamaChatResponse,
  OllamaListModelsResponseSchema,
  OllamaGenerateResponseSchema,
  OllamaChatResponseSchema
} from './types';
import {
  OllamaConnectionError,
  OllamaModelError,
  OllamaValidationError
} from './errors';

export class OllamaClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response: AxiosResponse = await this.client.get('/api/tags');
      const parsed = OllamaListModelsResponseSchema.parse(response.data);
      return parsed.models;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new OllamaConnectionError('Cannot connect to Ollama server. Is it running?', error);
        }
        if (error.response?.status) {
          throw new OllamaModelError(`HTTP ${error.response.status}: ${error.response.statusText || 'Unknown error'}`, error);
        }
        throw new OllamaConnectionError('Cannot connect to Ollama server. Is it running?', error);
      }
      throw new OllamaValidationError(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    }
  }

  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    try {
      const response: AxiosResponse = await this.client.post('/api/generate', request);
      const parsed = OllamaGenerateResponseSchema.parse(response.data);
      return parsed;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new OllamaConnectionError('Cannot connect to Ollama server. Is it running?', error);
        }
        if (error.response?.status === 404) {
          throw new OllamaModelError(`Model '${request.model}' not found. Try pulling it first.`, error);
        }
        if (error.response?.status) {
          throw new OllamaModelError(`HTTP ${error.response.status}: ${error.response.statusText || 'Unknown error'}`, error);
        }
        throw new OllamaConnectionError('Cannot connect to Ollama server. Is it running?', error);
      }
      throw new OllamaValidationError(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    }
  }

  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    try {
      const response: AxiosResponse = await this.client.post('/api/chat', request);
      const parsed = OllamaChatResponseSchema.parse(response.data);
      return parsed;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new OllamaConnectionError('Cannot connect to Ollama server. Is it running?', error);
        }
        if (error.response?.status === 404) {
          throw new OllamaModelError(`Model '${request.model}' not found. Try pulling it first.`, error);
        }
        if (error.response?.status) {
          throw new OllamaModelError(`HTTP ${error.response.status}: ${error.response.statusText || 'Unknown error'}`, error);
        }
        throw new OllamaConnectionError('Cannot connect to Ollama server. Is it running?', error);
      }
      throw new OllamaValidationError(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  async pullModel(modelName: string): Promise<void> {
    try {
      await this.client.post('/api/pull', { name: modelName });
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async showModel(modelName: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.post('/api/show', { name: modelName });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to show model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.client.delete('/api/delete', { data: { name: modelName } });
    } catch (error) {
      throw new Error(`Failed to delete model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}