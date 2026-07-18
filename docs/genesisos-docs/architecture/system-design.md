Genesis-OS Project Structure and Development Guide

## Overview

This guide provides a comprehensive overview of the Genesis-OS project structure, development workflow, and operational procedures. It serves as a reference for developers working on the platform.

## Project Philosophy

Genesis-OS is built on these core principles:

- **Modularity**: Each service operates independently while maintaining integration points
- **Scalability**: Designed to handle enterprise-level workloads
- **Flexibility**: Multiple deployment options (Docker, local development)
- **Performance**: Real-time processing optimized for latency-sensitive operations
- **Security**: Robust authentication and authorization mechanisms

## Project Architecture

Genesis-OS follows a microservices architecture with a clear separation of concerns:

### 1. Presentation Layer (Web App)
**Location**: `apps/web/`

The web layer provides the user interface and client-side functionality:

#### Key Components
- **Next.js Application**: React-based framework with server-side rendering
- **Authentication Context**: JWT-based auth management
- **Voice Integration**: WebSocket client for real-time voice communication
- **Dashboard**: Main interface with real-time analytics
- **AI Assistant**: Chat interface with Genesis AI

#### Technical Features
- **Next.js Routing**: File-system based routing for simple navigation
- **React Hooks**: Custom hooks for state management and API integration
- **TypeScript**: Full type coverage for better developer experience
- **Component Architecture**: Composable UI components with Tailwind CSS

### 2. API Gateway
**Location**: `services/api/`

The API Gateway provides a unified interface to all backend services:

#### Responsibilities
- **Request Routing**: Direct requests to appropriate microservices
- **Authentication**: JWT validation and token management
- **Load Balancing**: Distribute requests across multiple instances
- **Rate Limiting**: Prevent API abuse and ensure fair usage
- **Logging**: Comprehensive request/response logging

#### Endpoints
- **Auth API**: `/api/auth/*` - User authentication
- **Dashboard API**: `/api/dashboard/*` - Analytics data
- **Voice API**: `/api/voice/*` - Voice service status
- **AI API**: `/api/ai/*` - AI model access

### 3. Microservices

#### Voice Service
**Location**: `services/voice/`

Features:
- **WebSocket Communication**: Real-time audio streaming
- **STT (Speech-to-Text)**: Whisper-based transcription
- **TTS (Text-to-Speech)**: OpenAI voice synthesis
- **Command Processing**: Natural language intent recognition
- **Emotion Detection**: Voice emotion and sentiment analysis

#### AI Service
**Location**: `services/ai/`

Features:
- **Chat Completion**: OpenAI GPT-based conversational AI
- **Text Analysis**: Sentiment analysis, topic extraction
- **Prediction Engine**: Time series forecasting
- **Model Management**: Multiple AI model support

#### Analytics Service
**Location**: `services/analytics/`

Features:
- **Metrics Collection**: System and business metrics
- **Data Aggregation**: Time-series processing and summary
- **Storage**: Persistent metrics data
- **Reporting**: Formatted reports and insights

### 4. Shared Packages

#### Genesis Core
**Location**: `packages/core/`

Core utilities shared across all services:
- **Configuration**: Environment and app settings
- **Logging**: Structured logging infrastructure
- **Errors**: Custom error classes and handling
- **Types**: Shared TypeScript type definitions

#### AI Package
**Location**: `packages/ai/`

AI-specific utilities:
- **NLP Models**: Natural language processing
- **Sentiment Analysis**: Text sentiment detection
- **Prediction**: Forecasting algorithms
- **Prompts**: System prompt management

#### Voice Package
**Location**: `packages/voice/`

Voice processing utilities:
- **STT**: Speech-to-text interfaces
- **TTS**: Text-to-speech interfaces
- **WebRTC**: WebRTC connection management
- **Command Processing**: Voice command parsing

#### Security Package
**Location**: `packages/security/`

Security utilities:
- **Authentication**: Auth providers and validators
- **Encryption**: Encryption and hashing utilities
- **Permissions**: Access control mechanisms
- **Session Management**: Secure session handling

#### Integration Package
**Location**: `packages/integration/`

Third-party service integrations:
- **GitHub**: GitHub API integration
- **Slack**: Slack messaging API
- **Calendar**: Calendar API integration
- **Webhook Handler**: Event-driven processing

## Development Setup

### Local Development

#### Prerequisites
- Node.js 18+ with npm/yarn
- OpenAI API key (for AI features)
- Optional: Docker and Docker Compose

#### Quick Setup

```bash
# Clone the repository
git clone https://github.com/JustNCase/genesisos.git
ccd genesisos

# Install dependencies (using npm workspaces)
npm install

# Or using yarn
yarn install
```

#### Starting Services

Choose one of the following approaches:

##### Option 1: Individual Services

```bash
# Start API Gateway (3001)
cdnpm run dev:api

# Start Voice Service (3002)
cdnpm run dev:voice

# Start AI Service (3003)
cdnpm run dev:ai

# Start Analytics Service (3004)
cdnpm run dev:analytics

# Start Web App (3000)
cdnpm run dev:web
```

##### Option 2: Docker Compose

```bash
# Create .env file from .env.example
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

##### Option 3: Concurrently

```bash
# Start all services at once
cdnpm run dev

# (combines all services)
```

### Building

```bash
# Build all projects
cdnpm run build

# Build specific projects
cdnpm run build -w services/api
cdnpm run build -w apps/web
```

### Type Checking

```bash
cdnpm run typecheck
```

### Testing

#### Unit Tests
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
cdnpm run lint

# Fix lint issues
cdnpm run lint:fix
```

## Directory Structure Reference

### apps/web/
Main Next.js application with the user interface:

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # App layout
│   │   ├── page.tsx               # Home page
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard
│   │   └── login/page.tsx         # Login page
│   ├── components/
│   │   ├── ai/                   # AI components
│   │   ├── auth/                 # Authentication components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── ui/                  # UI components
│   │   ├── voice/               # Voice components
│   │   └── dashboard/           # Dashboard components
│   ├── hooks/
│   │   ├── useAIAssistant.ts   # AI assistant hook
│   │   ├── useAuth.ts          # Auth hook
│   │   ├── useDashboard.ts     # Dashboard hook
│   │   └── useVoice.ts        # Voice hook
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Auth utilities
│   │   ├── store.ts            # Zustand store
│   │   └── utils.ts            # Helper functions
│   ├── context/
│   │   ├── index.ts            # Exports
│   │   └── AuthContext.tsx     # Auth context
│   ├── types/
│   │   ├── index.ts           # General types
│   │   └── voice.ts            # Voice types
│   └── package.json
├── next.config.js              # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind configuration
└── postcss.config.js          # PostCSS configuration
```

### packages/
Shared libraries used across multiple services:

```
packages/
├── ai/
│   └── src/                   # AI models and utilities
├── core/
│   └── src/                   # Core utilities (config, logging, etc.)
├── integration/
│   └── src/                   # Third-party service integrations
├── security/
│   └── src/                   # Security utilities (auth, encryption)
└── voice/
    └── src/                   # Voice processing utilities
```

### services/
Backend microservices:

```
services/
├── api/
│   └── src/                   # API Gateway
├── voice/
│   └── src/                   # Voice Service
├── ai/
│   └── src/                   # AI Service
├── analytics/
│   └── src/                   # Analytics Service
```

## API Specifications

### API Gateway

The API Gateway serves as the primary interface to all services:

#### Base URL
```
http://localhost:3001
```

#### Authentication

##### Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Request:**
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
    "role": "admin"
  }
}
```

#### Dashboard APIs

##### Get Metrics
```http
GET /api/dashboard/metrics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "metrics": {
    "totalUsers": 142,
    "voiceCommands": 1204,
    "aiRequests": 892,
    "uptime": "99.7%"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Voice Service

##### WebSocket
```
ws://localhost:3002/ws
```

**Message Types:**
- `audio`: Send audio data for transcription
- `tts`: Request text-to-speech
- `ping`: Health check

#### AI Service

##### Chat
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "message": "Show me the analytics dashboard"
}
```

**Response:**
```json
{
  "response": "Displaying analytics overview...",
  "model": "gpt-4o-mini"
}
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-your-key-here

# API Ports
API_PORT=3001          # API Gateway
VOICE_PORT=3002        # Voice Service
AI_PORT=3003          # AI Service
ANALYTICS_PORT=3004   # Analytics Service
WEB_PORT=3000         # Web App (Next.js)

# Database (optional - in-memory by default)
DATABASE_URL=postgresql://genesis:genesis@localhost:5432/genesisos

# Caching (optional)
REDIS_URL=redis://localhost:6379

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VOICE_URL=ws://localhost:3002/ws
```

### Docker Configuration

Docker Compose supports:
- **Development**: Services running locally with shared volumes
- **Production**: Isolated services with persistent storage
- **Development**: Services running locally with shared volumes
- **Production**: Clean, optimized deployments

### Monitoring

The platform provides comprehensive monitoring capabilities:

- **Health Endpoints**: `/health` endpoints for all services
- **Metrics**: Custom metrics for performance monitoring
- **Logging**: Structured logging across all components
- **Alerting**: Basic alerting mechanisms

### Development Best Practices

#### Code Quality
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write comprehensive unit tests
- Use commit linting (conventional commits)

#### Security
- Use environment variables for secrets
- Implement secure password storage
- Validate and sanitize user inputs
- Use HTTPS in production

#### Performance
- Implement caching where appropriate
- Use CDN for static assets
- Optimize database queries
- Monitor and optimize for latency

## Deployment

### Docker

```bash
# Build and start all services
docker-compose up --build

# Start with production optimizations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f service-name

# Stop all services
docker-compose down
```

### Kubernetes

Templates for Kubernetes deployment:
- Deployment configurations for all services
- Service definitions for service discovery
- Persistent volume claims for data storage
- Ingress controllers for HTTP routing

### CI/CD

Automated deployment pipeline using GitHub Actions:
- Linting and type checking on PRs
- Build and test on merge
- Deploy to staging/ production
- Blue-green deployment strategies

## Migration Guide

### From Development to Production

1. **Environment Variables**: Move secrets to secure vault
2. **Configuration**: Adjust for production environment
3. **Scaling**: Configure load balancers and auto-scaling
4. **Monitoring**: Set up comprehensive monitoring
5. **Backup**: Implement backup and recovery procedures

### Upgrading

- Major versions often include breaking changes
- Follow the upgrade guide for each major version
- Test thoroughly in staging before production
- Check for deprecation warnings

## Troubleshooting

### Common Issues

#### "Module not found" Errors
- Ensure all dependencies are installed
- Check TypeScript paths configuration
- Verify workspace package.json setup

#### Authentication Issues
- Check environment variables are set
- Verify JWT token format and expiration
- Test auth endpoints with curl or Postman

#### Performance Issues
- Check service logs for bottlenecks
- Verify database connection pooling
- Monitor memory and CPU usage

### Debugging

#### Local Development
- Use `docker-compose logs -f service-name`
- Check `docker logs container-id`
- Use `cd services/service-name && npm run dev` for verbose output

#### Production
- Review application logs
- Check monitoring dashboards
- Use APM tools for performance tracing

## FAQ

### How do I add a new service?

1. Create directory in `services/`
2. Add package.json with necessary dependencies
3. Add tsconfig.json for TypeScript configuration
4. Implement necessary endpoints
5. Update API Gateway routing

### How do I add a new package?

1. Create directory in `packages/`
2. Add package.json with dependencies on core packages
3. Implement functionality
4. Update root tsconfig.base.json if needed

### How do I test all services together?

Use `npm run test:all` (if configured) or test through the API Gateway endpoint.

### How do I monitor the system?

1. Check health endpoints: `/api/auth/me`, `/api/dashboard/metrics`, `/api/ai/chat`, `/api/voice/status`
2. Monitor logs for errors and warnings
3. Use Docker Compose logs for all services

## Contact

For questions or support, please visit:
- GitHub Issues: https://github.com/JustNCase/CloudingForge/issues
- Project Documentation: https://github.com/JustNCase/CloudingForge/tree/main/docs

---

*This guide is continuously updated. Please refer to the latest version for the most up-to-date information.*

## Version History

### v0.1.0 (Current)
- Initial MVP release
- All core services implemented
- Full authentication system
- Voice control with OpenAI integration
- Real-time analytics dashboard

### v0.2.0 (Planned)
- Advanced voice commands
- Multi-language support
- Enhanced AI capabilities
- Mobile app development

### v0.3.0 (Planned)
- Advanced analytics
- Custom dashboard templates
- Export functionality
- Community features

## Legal

See LICENSE file for detailed licensing information.

## Acknowledgments

Special thanks to the open source community and contributors who have helped make this project possible.

---

*Genesis-OS - Building the Future of Intelligent Dashboards*

Generated by OpenCode Agent System

Last Updated: $(date -Iseconds)
"""
