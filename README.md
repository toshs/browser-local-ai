# Browser Local AI

Privacy-first Chrome Extension for AI-powered productivity, running entirely in your browser using Gemini Nano.

## Features

- **Privacy & Security**: All data processing runs locally. No data leaves your machine.
- **Offline Capable**: Works without an internet connection.
- **Tools**:
  - **Chat**: Interact with the AI model directly.
  - **Summarize**: Quickly get key points from text.
  - **Translate**: Translate text between languages.
- **Context Menu Integration**: Right-click to summarize pages, translate text, or explain code.

## Installation

1. Clone the repository.
2. Run `pnpm install` dependencies.
3. Run `pnpm build` to build the extension.
4. Open `chrome://extensions`.
5. Enable "Developer mode".
6. Click "Load unpacked" and select the `dist` directory.

## Requirements

- Chrome Canary (or highly recent Chrome) with Gemini Nano enabled.
- Flags:
  - `chrome://flags/#prompt-api-for-gemini-nano` -> Enabled
  - `chrome://flags/#summarization-api-for-gemini-nano` -> Enabled
  - `chrome://flags/#translation-api` -> Enabled (if available)

## Development

```bash
pnpm install
pnpm dev
```
