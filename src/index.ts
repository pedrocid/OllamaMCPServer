#!/usr/bin/env node

import { OllamaMCPServer } from './server.js';

async function main(): Promise<void> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  
  try {
    const server = new OllamaMCPServer(ollamaUrl);
    await server.run();
  } catch (error) {
    console.error('Failed to start Ollama MCP server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}