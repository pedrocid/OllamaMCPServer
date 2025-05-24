# Ollama MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with local Ollama models. This server enables AI assistants to interact with Ollama's REST API through the MCP protocol.

## Features

- **Model Management**: List, pull, show, and delete Ollama models
- **Text Generation**: Generate completions using any available Ollama model
- **Chat Interface**: Multi-turn conversations with context preservation
- **Health Monitoring**: Check Ollama server connectivity
- **Error Handling**: Comprehensive error reporting with specific error types
- **Type Safety**: Full TypeScript implementation with Zod validation

## Prerequisites

- Node.js 20+ 
- [Ollama](https://ollama.ai) installed and running locally
- At least one Ollama model pulled (e.g., `ollama pull llama3.2`)

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server

Start the server for MCP clients:

```bash
npm start
```

### Development

```bash
npm run dev
```

## Available Tools

### `ollama_list_models`
Lists all available Ollama models on the local machine.

**Input**: None
**Output**: Array of models with metadata

### `ollama_generate`
Generate text completion using an Ollama model.

**Input**:
- `model` (required): Model name (e.g., "llama3.2")
- `prompt` (required): Text prompt
- `system` (optional): System message
- `options` (optional): Model parameters (temperature, top_p, etc.)
- `stream` (optional): Enable streaming (default: false)

### `ollama_chat`
Have a conversation with an Ollama model.

**Input**:
- `model` (required): Model name
- `messages` (required): Array of conversation messages
- `options` (optional): Model parameters
- `stream` (optional): Enable streaming (default: false)

### `ollama_pull_model`
Download a model from Ollama registry.

**Input**:
- `model` (required): Model name to pull

### `ollama_show_model`
Show detailed information about a specific model.

**Input**:
- `model` (required): Model name

### `ollama_delete_model`
Delete a model from the local machine.

**Input**:
- `model` (required): Model name to delete

### `ollama_health_check`
Check if Ollama server is running and accessible.

**Input**: None
**Output**: Health status and server information

## Configuration

Set the Ollama server URL via environment variable:

```bash
export OLLAMA_URL=http://localhost:11434
```

Default: `http://localhost:11434`

## Example Usage

```typescript
// Example tool call for text generation
{
  "toolName": "ollama_generate",
  "arguments": {
    "model": "llama3.2",
    "prompt": "Explain quantum computing in simple terms",
    "options": {
      "temperature": 0.7,
      "top_p": 0.9
    }
  }
}

// Example chat conversation
{
  "toolName": "ollama_chat",
  "arguments": {
    "model": "llama3.2", 
    "messages": [
      {"role": "user", "content": "What is the capital of France?"},
      {"role": "assistant", "content": "The capital of France is Paris."},
      {"role": "user", "content": "What's the population?"}
    ]
  }
}
```

## Error Handling

The server provides specific error types:

- `connection_error`: Cannot connect to Ollama server
- `model_error`: Model-related issues (not found, etc.)
- `ollama_error`: General Ollama API errors
- `unknown_error`: Unexpected errors

## Project Structure

```
src/
├── index.ts          # Entry point
├── server.ts         # MCP server implementation
├── ollama-client.ts  # Ollama REST API client
├── types.ts          # TypeScript types and Zod schemas
└── errors.ts         # Custom error classes
```

## Development Commands

```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode with ts-node
npm run lint       # Run ESLint
npm run typecheck  # Type checking only
```

## License

MIT