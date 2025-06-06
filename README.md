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

## Quick Start

### Option 1: Automated Installation (Easiest)

```bash
# Clone and install with one script
git clone <repository-url>
cd ollama-mcp-server
./install.sh
```

The install script will:
- Check Node.js and Ollama prerequisites
- Install dependencies and build the project
- Test Ollama connection
- Show next steps

### Option 2: Using npx (Recommended)

You can run the server directly without installing globally:

```bash
# Clone the repository
git clone <repository-url>
cd ollama-mcp-server

# Install dependencies and build
npm install
npm run build

# Run with npx
npx . 

# Or run directly
npm start
```

**Benefits of npx approach:**
- No global installation required
- Easy to update and manage
- Works well with MCP client configurations
- Portable across different environments

### Option 2: Global Installation

```bash
# Install globally
npm install -g .

# Run from anywhere
ollama-mcp-server
```

### Option 3: Local Development

```bash
npm install
npm run build
npm start
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

## Setup with Cursor IDE

To use this MCP server with Cursor IDE, you need to configure it in your MCP settings:

### 1. Install and Build the Server

```bash
git clone <repository-url>
cd ollama-mcp-server
npm install
npm run build
```

### 2. Configure Cursor

Add the following to your Cursor MCP configuration file (usually at `~/.cursor-mcp/config.json` or similar):

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

### 3. Alternative: Using npx in Cursor

You can also configure Cursor to use npx:

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["/path/to/ollama-mcp-server"],
      "env": {
        "OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

### 4. Verify Setup

After configuration, restart Cursor and you should see the Ollama tools available in the MCP tool list:
- `ollama_list_models`
- `ollama_generate`
- `ollama_chat`
- `ollama_pull_model`
- `ollama_show_model`
- `ollama_delete_model`
- `ollama_health_check`

## Configuration

Set the Ollama server URL via environment variable:

```bash
export OLLAMA_URL=http://localhost:11434
```

Default: `http://localhost:11434`

### Environment Variables

- **OLLAMA_URL**: Ollama server URL (default: `http://localhost:11434`)
- **NODE_ENV**: Environment mode (`development`, `production`)
- **DEBUG**: Enable debug logging (`true`/`false`)

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