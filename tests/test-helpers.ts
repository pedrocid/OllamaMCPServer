import { Server } from 'http';
import express from 'express';

export class MockOllamaServer {
  private app: express.Application;
  private server: Server | null = null;
  private port: number;

  constructor(port: number = 11435) {
    this.port = port;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/', (req, res) => {
      res.send('Ollama is running');
    });

    // List models
    this.app.get('/api/tags', (req, res) => {
      res.json({
        models: [
          {
            name: 'llama3.2:latest',
            model: 'llama3.2',
            modified_at: '2024-01-01T00:00:00Z',
            size: 4000000000,
            digest: 'sha256:test123',
            details: {
              parent_model: '',
              format: 'gguf',
              family: 'llama',
              families: ['llama'],
              parameter_size: '7B',
              quantization_level: 'Q4_0'
            }
          },
          {
            name: 'mistral:latest',
            model: 'mistral',
            modified_at: '2024-01-01T00:00:00Z',
            size: 3500000000,
            digest: 'sha256:test456',
            details: {
              parent_model: '',
              format: 'gguf',
              family: 'mistral',
              families: ['mistral'],
              parameter_size: '7B',
              quantization_level: 'Q4_0'
            }
          }
        ]
      });
    });

    // Generate
    this.app.post('/api/generate', (req, res) => {
      const { model, prompt } = req.body;
      
      if (model === 'nonexistent-model') {
        return res.status(404).json({ error: 'model not found' });
      }

      res.json({
        model,
        created_at: new Date().toISOString(),
        response: `Generated response for: ${prompt}`,
        done: true,
        context: [1, 2, 3, 4, 5],
        total_duration: 1000000000,
        load_duration: 100000000,
        prompt_eval_count: prompt.split(' ').length,
        prompt_eval_duration: 200000000,
        eval_count: 20,
        eval_duration: 300000000
      });
    });

    // Chat
    this.app.post('/api/chat', (req, res) => {
      const { model, messages } = req.body;
      
      if (model === 'nonexistent-model') {
        return res.status(404).json({ error: 'model not found' });
      }

      const lastMessage = messages[messages.length - 1];
      res.json({
        model,
        created_at: new Date().toISOString(),
        message: {
          role: 'assistant',
          content: `Response to: ${lastMessage.content}`
        },
        done: true,
        total_duration: 1000000000,
        eval_count: 15,
        eval_duration: 400000000
      });
    });

    // Pull model
    this.app.post('/api/pull', (req, res) => {
      const { name } = req.body;
      
      if (name === 'invalid-model') {
        return res.status(400).json({ error: 'invalid model name' });
      }

      res.json({ status: 'success' });
    });

    // Show model
    this.app.post('/api/show', (req, res) => {
      const { name } = req.body;
      
      if (name === 'nonexistent-model') {
        return res.status(404).json({ error: 'model not found' });
      }

      res.json({
        modelfile: `FROM ${name}`,
        parameters: 'temperature 0.8\ntop_p 0.9',
        template: '{{ .Prompt }}',
        details: {
          family: name.includes('llama') ? 'llama' : 'mistral',
          parameter_size: '7B',
          quantization_level: 'Q4_0'
        }
      });
    });

    // Delete model
    this.app.delete('/api/delete', (req, res) => {
      const { name } = req.body;
      
      if (name === 'nonexistent-model') {
        return res.status(404).json({ error: 'model not found' });
      }

      res.json({ status: 'success' });
    });

    // Error simulation endpoint
    this.app.get('/api/error/:code', (req, res) => {
      const code = parseInt(req.params.code);
      res.status(code).json({ error: `Simulated error ${code}` });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  isRunning(): boolean {
    return this.server !== null;
  }
}

// Helper function to create mock responses
export const createMockModel = (name: string, family: string = 'llama') => ({
  name: `${name}:latest`,
  model: name,
  modified_at: '2024-01-01T00:00:00Z',
  size: 4000000000,
  digest: `sha256:${name}123`,
  details: {
    parent_model: '',
    format: 'gguf',
    family,
    families: [family],
    parameter_size: '7B',
    quantization_level: 'Q4_0'
  }
});

export const createMockGenerateResponse = (model: string, prompt: string) => ({
  model,
  created_at: new Date().toISOString(),
  response: `Generated response for: ${prompt}`,
  done: true,
  context: [1, 2, 3, 4, 5],
  total_duration: 1000000000,
  load_duration: 100000000,
  prompt_eval_count: prompt.split(' ').length,
  prompt_eval_duration: 200000000,
  eval_count: 20,
  eval_duration: 300000000
});

export const createMockChatResponse = (model: string, content: string) => ({
  model,
  created_at: new Date().toISOString(),
  message: {
    role: 'assistant' as const,
    content: `Response to: ${content}`
  },
  done: true,
  total_duration: 1000000000,
  eval_count: 15,
  eval_duration: 400000000
});