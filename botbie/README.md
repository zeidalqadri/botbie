# Botbie - AI-Powered Bot Automation System

Botbie is an intelligent bot orchestration and automation platform that leverages AI agents to perform complex tasks efficiently.

## Features

- **Task Queue Management**: Efficient task processing with configurable concurrency
- **WebSocket Support**: Real-time communication and event streaming
- **Agent System**: Extensible agent architecture for different automation tasks
- **REST API**: Simple HTTP interface for task submission and monitoring
- **Configurable**: Environment-based configuration for easy deployment

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /task` - Submit a new task
- `GET /task/:id` - Get task status
- `GET /agents` - List available agents

## WebSocket Events

Connect to `ws://localhost:3000` for real-time updates:

- `taskComplete` - Fired when a task completes
- `taskError` - Fired when a task fails

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

## Architecture

```
botbie/
├── src/
│   ├── core/           # Core system components
│   ├── agents/         # Agent implementations
│   ├── services/       # Service layer
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript type definitions
├── dist/               # Compiled JavaScript
└── tests/              # Test files
```

## Configuration

Configuration is managed through environment variables. See `.env.example` for available options.

## License

MIT