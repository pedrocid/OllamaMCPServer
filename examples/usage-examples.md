# Usage Examples

## Basic Model Interaction

### List Available Models
```json
{
  "tool": "ollama_list_models",
  "arguments": {}
}
```

### Generate Text
```json
{
  "tool": "ollama_generate", 
  "arguments": {
    "model": "llama3.2",
    "prompt": "Write a short story about a robot learning to paint",
    "options": {
      "temperature": 0.8,
      "max_tokens": 500
    }
  }
}
```

### Chat Conversation
```json
{
  "tool": "ollama_chat",
  "arguments": {
    "model": "llama3.2",
    "messages": [
      {
        "role": "system", 
        "content": "You are a helpful coding assistant."
      },
      {
        "role": "user",
        "content": "How do I reverse a string in Python?"
      }
    ]
  }
}
```

## Model Management

### Pull a New Model
```json
{
  "tool": "ollama_pull_model",
  "arguments": {
    "model": "mistral"
  }
}
```

### Show Model Information
```json
{
  "tool": "ollama_show_model", 
  "arguments": {
    "model": "llama3.2"
  }
}
```

### Delete a Model
```json
{
  "tool": "ollama_delete_model",
  "arguments": {
    "model": "old-model"
  }
}
```

## Advanced Usage

### Code Generation with Context
```json
{
  "tool": "ollama_generate",
  "arguments": {
    "model": "codellama",
    "prompt": "Create a Python function that calculates fibonacci numbers",
    "system": "You are an expert Python developer. Write clean, well-documented code.",
    "options": {
      "temperature": 0.2,
      "top_p": 0.9
    }
  }
}
```

### Multi-turn Technical Discussion
```json
{
  "tool": "ollama_chat",
  "arguments": {
    "model": "llama3.2",
    "messages": [
      {
        "role": "user",
        "content": "Explain microservices architecture"
      },
      {
        "role": "assistant", 
        "content": "Microservices architecture is a design pattern where applications are composed of small, independent services..."
      },
      {
        "role": "user",
        "content": "What are the main challenges with this approach?"
      }
    ],
    "options": {
      "temperature": 0.5
    }
  }
}
```

## Health Monitoring

### Check Server Status
```json
{
  "tool": "ollama_health_check",
  "arguments": {}
}
```

## Configuration Examples

### Custom Ollama URL
Set environment variable before starting:
```bash
export OLLAMA_URL=http://192.168.1.100:11434
npm start
```

### Using with Claude Code
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["/path/to/ollama-mcp-server/dist/index.js"],
      "env": {
        "OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

## Error Handling Examples

### Connection Error Response
```json
{
  "error": true,
  "error_type": "connection_error", 
  "message": "Cannot connect to Ollama server. Is it running?",
  "tool": "ollama_list_models"
}
```

### Model Not Found Response  
```json
{
  "error": true,
  "error_type": "model_error",
  "message": "Model 'nonexistent-model' not found. Try pulling it first.",
  "tool": "ollama_generate"
}
```