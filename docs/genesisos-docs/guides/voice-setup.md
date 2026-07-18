# Voice Setup Guide

## Overview

Genesis-OS uses WebRTC for real-time audio streaming, Whisper for STT, and OpenAI TTS for voice synthesis.

## Configuration

1. Set your OpenAI API key in `.env`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

2. Choose your Whisper model:
   ```
   WHISPER_MODEL=base  # tiny | base | small | medium | large
   ```

3. Start the voice service:
   ```bash
   cd services/voice
   npm run dev
   ```

## Voice Commands

Genesis-OS supports natural language voice commands:

| Command | Action |
|---------|--------|
| "Genesis, show analytics" | Opens analytics dashboard |
| "Genesis, create report" | Starts report generation |
| "Genesis, search for..." | Performs search |
| "Genesis, help" | Shows available commands |

## Wake Word

The default wake word is "Genesis". Say "Genesis" followed by your command.
