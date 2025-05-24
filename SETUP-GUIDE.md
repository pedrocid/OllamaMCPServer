# Setup Guide for Ollama MCP Server

This guide explains how to set up the Ollama MCP Server with various MCP clients and IDEs.

## Prerequisites

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Start Ollama and pull a model**
   ```bash
   # Start Ollama service
   ollama serve
   
   # Pull a model (in another terminal)
   ollama pull llama3.2
   ```

3. **Install and build the MCP server**
   ```bash
   git clone <repository-url>
   cd ollama-mcp-server
   npm install
   npm run build
   ```

## Setup with Cursor IDE

### Method 1: Direct Node.js execution

1. **Find your Cursor MCP config file**
   - macOS: `~/Library/Application Support/Cursor/User/globalStorage/mcp-config.json`
   - Linux: `~/.config/Cursor/User/globalStorage/mcp-config.json` 
   - Windows: `%APPDATA%\Cursor\User\globalStorage\mcp-config.json`

2. **Add the server configuration**
   ```json
   {
     "mcpServers": {
       "ollama": {
         "command": "node",
         "args": ["/absolute/path/to/ollama-mcp-server/dist/index.js"],
         "env": {
           "OLLAMA_URL": "http://localhost:11434"
         }
       }
     }
   }
   ```

### Method 2: Using npx

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["/absolute/path/to/ollama-mcp-server"],
      "env": {
        "OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

### Method 3: Global installation

1. **Install globally**
   ```bash
   npm install -g .
   ```

2. **Configure Cursor**
   ```json
   {
     "mcpServers": {
       "ollama": {
         "command": "ollama-mcp-server",
         "args": [],
         "env": {
           "OLLAMA_URL": "http://localhost:11434"
         }
       }
     }
   }
   ```

## Setup with Claude Desktop

1. **Locate Claude Desktop config**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add MCP server configuration**
   ```json
   {
     "mcpServers": {
       "ollama": {
         "command": "node",
         "args": ["/absolute/path/to/ollama-mcp-server/dist/index.js"],
         "env": {
           "OLLAMA_URL": "http://localhost:11434"
         }
       }
     }
   }
   ```

## Setup with Other MCP Clients

### Generic MCP Client

For any MCP client that supports server configuration:

```json
{
  "servers": {
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

### Command Line Usage

You can also run the server directly for testing:

```bash
# Run the server
npm start

# Or with custom Ollama URL
OLLAMA_URL=http://custom-host:11434 npm start

# Development mode
npm run dev
```

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Ollama server URL
OLLAMA_URL=http://localhost:11434

# Debug logging
DEBUG=true

# Node environment
NODE_ENV=development
```

### Custom Ollama Configuration

If your Ollama server runs on a different host/port:

```bash
# Remote Ollama server
OLLAMA_URL=http://192.168.1.100:11434

# Custom port
OLLAMA_URL=http://localhost:8080
```

## Verification

After setup, verify the connection:

1. **Check Ollama is running**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Test the MCP server**
   ```bash
   # List available models through MCP
   # This will appear as a tool in your MCP client
   ```

3. **Available tools in your MCP client**
   - `ollama_list_models`: List all models
   - `ollama_generate`: Generate text
   - `ollama_chat`: Chat with model
   - `ollama_pull_model`: Download model
   - `ollama_show_model`: Show model info
   - `ollama_delete_model`: Remove model
   - `ollama_health_check`: Check server status

## Troubleshooting

### Common Issues

1. **"Cannot connect to Ollama server"**
   - Ensure Ollama is running: `ollama serve`
   - Check the URL in your configuration
   - Verify Ollama is accessible: `curl http://localhost:11434`

2. **"ollama-mcp-server command not found"**
   - Ensure you built the project: `npm run build`
   - Use absolute paths in configuration
   - Check that Node.js is in your PATH

3. **"Model not found"**
   - Pull the model first: `ollama pull llama3.2`
   - Check available models: `ollama list`

4. **Permission errors**
   - Ensure the MCP server file is executable
   - Check file permissions: `chmod +x dist/index.js`

5. **MCP client doesn't see the server**
   - Restart your MCP client after configuration
   - Check the configuration file syntax (valid JSON)
   - Verify file paths are absolute, not relative

### Debug Mode

Enable debug logging:

```bash
DEBUG=true npm start
```

Or in your MCP client configuration:
```json
{
  "env": {
    "OLLAMA_URL": "http://localhost:11434",
    "DEBUG": "true"
  }
}
```

### Log Files

Check logs for issues:
- MCP client logs (varies by client)
- Ollama logs: `journalctl -u ollama` (Linux) or check Ollama console output
- Node.js console output from the MCP server

## Advanced Configuration

### Multiple Ollama Servers

You can configure multiple Ollama instances:

```json
{
  "mcpServers": {
    "ollama-local": {
      "command": "node",
      "args": ["/path/to/ollama-mcp-server/dist/index.js"],
      "env": {
        "OLLAMA_URL": "http://localhost:11434"
      }
    },
    "ollama-remote": {
      "command": "node", 
      "args": ["/path/to/ollama-mcp-server/dist/index.js"],
      "env": {
        "OLLAMA_URL": "http://remote-server:11434"
      }
    }
  }
}
```

### Custom Model Settings

Configure default model parameters by modifying the server code or using tool arguments:

```json
{
  "tool": "ollama_generate",
  "arguments": {
    "model": "llama3.2",
    "prompt": "Hello world",
    "options": {
      "temperature": 0.7,
      "top_p": 0.9,
      "max_tokens": 500
    }
  }
}
```