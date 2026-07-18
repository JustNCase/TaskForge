genesis-os: A Comprehensive AI-Powered Dashboard Platform

## Overview

Genesis-OS is a complete AI-powered dashboard platform that combines real-time analytics, voice control, and intelligent automation. It serves as a unified interface for business intelligence, allowing users to monitor metrics, interact via voice commands, and receive AI-powered insights.

## Key Features

### 🎭 Voice Control
- **Natural Language Commands**: Speak to navigate dashboards, search data, and execute actions
- **Real-time Processing**: Instant transcription and response via WebRTC
- **Multi-language Support**: Process voice input in multiple languages

### 📊 Real-time Analytics
- **Live Metrics**: CPU, memory, network, and application performance
- **Interactive Charts**: Area charts for trends, bar charts for comparisons
- **Activity Feed**: Recent system events and user actions

### 🤖 AI Integration
- **LLM Chat Assistant**: Genesis AI assistant for natural conversation
- **Sentiment Analysis**: Analyze user sentiment from text and voice
- **Prediction Engine**: Forecast trends and anomalies

### 🔐 Authentication
- **JWT-based Auth**: Secure token-based authentication
- **Role-based Access**: Admin, user, and viewer permissions
- **Session Management**: Secure session handling

### 🏗️ Architecture
Genesis-OS follows a micro-frontend architecture with:
- **Next.js Web App**: React-based UI with authentication
- **API Gateway**: Centralized REST API handling all requests
- **Service Modules**: Dedicated services for voice, AI, analytics
- **Shared Packages**: Reusable TypeScript utilities

## Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key (for AI features)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/JustNCase/genesisos.git
cd genesisos

# Install dependencies
npm install

# Start with Docker
docker-compose up -d

# Or start manually
npm run dev
```

### Running Locally

```bash
# Start all services (API, Voice, AI, Analytics, Web)
npm run dev

# Individual services
npm run dev:api      # API Gateway (3001)
npm run dev:voice    # Voice Service (3002)
npm run dev:ai       # AI Service (3003)
npm run dev:analytics # Analytics Service (3004)
npm run dev:web      # Web Dashboard (3000)
```

## API Reference

### Authentication API

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@genesis.os",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "email": "user@genesis.os",
    "name": "User Name",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/auth/me
Get current user information (protected route).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@genesis.os",
  "name": "User Name",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Dashboard API

#### GET /api/dashboard/metrics
Get dashboard metrics.

**Response:**
```json
{
  "metrics": {
    "totalUsers": 142,
    "activeSessions": 38,
    "voiceCommands": 1204,
    "aiRequests": 892,
    "uptime": "99.7%"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/dashboard/activity
Get recent activity feed.

**Response:**
```json
{
  "activities": [
    {
      "id": "1",
      "type": "voice",
      "message": "Voice command: 'Show analytics'",
      "time": "2m ago"
    }
  ]
}
```

### Voice API

#### WebSocket: ws://localhost:3002/ws

Real-time voice communication channel.

**Messages:**
- `{ type: "audio", data: "<base64-audio>" }` — Send audio for transcription
- `{ type: "tts", text: "Hello", voice: "nova" }` — Request text-to-speech
- `{ type: "ping" }` — Health check

**Responses:**
- `{ type: "transcript", text: "...", confidence: 0.9, command: {...}, emotion: {...} }`
- `{ type: "tts_audio", data: "<base64-audio>" }`
- `{ type: "pong", timestamp: ... }`

### AI API

#### POST /api/ai/chat
AI chat with conversation history.

**Request Body:**
```json
{
  "message": "Show me the analytics dashboard",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

**Response:**
```json
{
  "response": "Displaying analytics overview...",
  "model": "gpt-4o-mini",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 80,
    "total_tokens": 180
  }
}
```

#### POST /api/ai/analyze
Analyze text for sentiment and insights.

**Request Body:**
```json
{
  "text": "The system is performing well today."
}
```

**Response:**
```json
{
  "analysis": {
    "sentiment": "positive",
    "insights": ["Performance metrics are good"],
    "confidence": 0.8
  },
  "model": "gpt-4o-mini"
}
```

## Development

### Project Structure

```
genesis-os/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── dashboard/
│       │   │   └── login/page.tsx
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   ├── ui/
│       │   │   ├── voice/
│       │   │   └── auth/
│       │   ├── hooks/
│       │   └── lib/
│       └── package.json
├── packages/
│   ├── core/
│   │   └── src/          # Config, logging, types
│   ├── ai/
│   │   └── src/         # NLP, sentiment, prompts
│   ├── voice/
│   │   └── src/         # STT, TTS, commands
│   ├── security/
│   │   └── src/         # Auth, encryption
│   └── integration/
│       └── src/         # Connectors, webhooks
├── services/
│   ├── api/
│   │   └── src/         # REST API gateway
│   ├── voice/
│   │   └── src/         # WebSocket voice service
│   ├── ai/
│   │   └── src/         # AI model serving
│   └── analytics/
│       └── src/         # Metrics collection
└── docs/                # Documentation
    ├── api/
    ├── architecture/
    └── guides/
```

### Development Workflow

1. **Local Development**
   - `npm run dev:web` - Start Next.js web app
   - `npm run dev:api` - Start API gateway
   - `npm run dev:voice` - Start voice service
   - `npm run dev:ai` - Start AI service
   - `npm run dev:analytics` - Start analytics service

2. **Building**
   ```bash
   npm run build
   ```

3. **Type Checking**
   ```bash
   npm run typecheck
   ```

4. **Linting**
   ```bash
   npm run lint
   ```

### IDE Configuration

This project uses TypeScript with Next.js. Recommended extensions:
- **TypeScript** (by Microsoft)
- **ESLint**
- **Prettier"
- **Path Intellisense**
- **Auto Import**

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# OpenAI API key (required for AI features)
OPENAI_API_KEY=sk-your-key-here

# Database URL (optional - currently using in-memory)
DATABASE_URL=postgresql://genesis:genesis@localhost:5432/genesisos

# Redis URL (optional - currently using in-memory)
REDIS_URL=redis://localhost:6379

# API port
API_PORT=3001

# Voice port
VOICE_PORT=3002

# AI port
AI_PORT=3003

# Analytics port
ANALYTICS_PORT=3004
```

## Voice Command Examples

| Command | Intent |
|---------|--------|
| "Genesis, show analytics" | Display analytics dashboard |
| "Navigate to dashboard" | Navigate to dashboard |
| "Enable voice mode" | Enable voice command mode |
| "Search for report" | Search for reports |
| "Help" | Show available commands |

## Tips and Tricks

### Voice
- Wake word: "Genesis"
- Support for multiple commands per session
- Emotion detection from voice input

### Dashboard
- Use tabs to switch between realtime and weekly views
- Click on chart areas for detailed time ranges
- Hover over metrics for more details

### AI
- Chat with Genesis about your data and insights
- Ask for predictions based on historical data
- Request sentiment analysis of text data

## Troubleshooting

### Common Issues

#### Voice not working
1. Check that the voice service is running
2. Ensure microphone permissions are granted
3. Try a different environment (network restrictions)

#### AI features not responding
1. Verify OPENAI_API_KEY is set in .env
2. Check service status on their respective health endpoints
3. Ensure all services are running

#### Dashboard not loading
1. Check browser console for JavaScript errors
2. Clear browser cache if needed
3. Verify network connectivity

## Future Enhancements

### Planned Features
1. **Advanced Voice Recognition** - Speaker identification
2. **Real-time Data Streaming** - Live data from external sources
3. **Dashboard Templates** - Pre-built dashboard layouts
4. **Export Functionality** - Export data as CSV/JSON/PDF
5. **Alerts and Notifications** - System alerts and user notifications
6. **Multi-tenant Support** - Support for multiple organizations
7. **Mobile App** - Native mobile applications
8. **Voice-to-Dashboard Automation** - Automatically create dashboards from voice commands

### OpenAPI Specification
Full OpenAPI 3.0 specification will be provided for service integration.

## Contributing

### Code Standards
- Use TypeScript for all new code
- Follow React hooks conventions
- Implement comprehensive error handling
- Write unit tests for all new functionality

### Pull Requests
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Run tests and lint
5. Create a pull request

## License

Genesis-OS is released under the MIT License. See LICENSE file for details.

## Acknowledgments

- [OpenAI](https://openai.com) - API platform for AI features
- [Next.js](https://nextjs.org) - React framework
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) - Real-time communication
- [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Recharts](https://recharts.org) - Chart library

## Support

For issues and questions, please visit:
- GitHub Issues: https://github.com/JustNCase/CloudingForge/issues
- Documentation: https://github.com/JustNCase/CloudingForge/tree/main/docs

---

*Genesis-OS - Where AI meets Control*
"""
