# Dia Chrome — Implementation Plan

A Chrome extension that adds a persistent LLM chat side panel. Highlight text on any webpage, and it flows into the chat window where you can ask questions about it.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Chrome Browser Tab                                     │
│ ┌──────────────────────────┐  ┌───────────────────────┐ │
│ │     Web Page             │  │    Side Panel (Chat)   │ │
│ │                          │  │                        │ │
│ │  content.js listens for  │  │  sidepanel.html/js     │ │
│ │  mouseup → captures      │──│  receives highlighted  │ │
│ │  selected text + XPath   │  │  text, shows quote,    │ │
│ │                          │  │  auto-focuses input    │ │
│ │  Sends message via       │  │                        │ │
│ │  chrome.runtime          │  │  User types question   │ │
│ │                          │  │  → calls LLM API      │ │
│ │                          │  │  → streams response    │ │
│ └──────────────────────────┘  └───────────────────────┘ │
│                                         │               │
│              background.js              │               │
│           (service worker:              │               │
│            routes messages,             │               │
│            manages side panel)          │               │
│                                         ▼               │
│                                 ┌───────────────┐       │
│                                 │  LLM API      │       │
│                                 │  (OpenAI /    │       │
│                                 │   Gemini /    │       │
│                                 │   Ollama)     │       │
│                                 └───────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
dia-chrome/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Service worker
├── content.js             # Injected into web pages
├── sidepanel.html         # Side panel markup
├── sidepanel.js           # Side panel logic + LLM calls
├── sidepanel.css          # Side panel styles
├── options.html           # Settings page
├── options.js             # Settings logic
├── options.css            # Settings styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── implementation.md      # This file
├── gameplan-gemini.md     # Original planning chat
└── clarification-gemini.md# Clarification chat
```

## Component Details

### 1. manifest.json

- **Manifest V3** (required for modern Chrome)
- Permissions: `activeTab`, `sidePanel`, `storage`, `contextMenus`
- Content script injected on all URLs (`<all_urls>`)
- Service worker as background script
- Side panel declared with `default_path`

### 2. background.js — Service Worker

Responsibilities:
- Register the side panel on extension install
- Open the side panel when extension icon is clicked
- Route messages from content script to side panel
- Handle context menu "Ask Dia about selection"

### 3. content.js — Content Script

Responsibilities:
- Listen for `mouseup` events on the page
- Check `window.getSelection().toString()` for non-empty text
- Compute XPath of the selection anchor node
- Send `{ type: "TEXT_SELECTED", text, xpath, pageUrl, pageTitle }` via `chrome.runtime.sendMessage()`
- Minimal footprint — no UI injection on the page

### 4. Side Panel (sidepanel.html + sidepanel.js + sidepanel.css)

**UI Layout:**
- Header bar with extension name + settings gear icon
- Chat message area (scrollable)
- When text is highlighted: a quote block appears showing the selected text
- Chat input textarea + send button at the bottom
- Messages render as bubbles (user on right, assistant on left)
- Markdown rendering for LLM responses

**Logic (sidepanel.js):**
- Listen for `chrome.runtime.onMessage` to receive highlighted text
- On receiving text: display in quote block, auto-focus input
- On send: construct prompt with context (highlighted text + user question)
- Call LLM API with streaming (`fetch` with `ReadableStream`)
- Append streamed tokens to assistant message bubble in real-time
- Persist conversation per tab (cleared on new highlight or manual clear)

### 5. Options Page (options.html + options.js)

Settings:
- **LLM Provider**: dropdown (OpenAI, Google Gemini, Ollama/Local, Custom)
- **API Key**: password input
- **API Base URL**: text input (for custom/Ollama endpoints)
- **Model**: text input (e.g., `gpt-4o`, `gemini-pro`, `llama3`)
- **System Prompt**: textarea with default prompt
- Saved to `chrome.storage.sync`

### 6. LLM Integration

All providers use OpenAI-compatible chat completions format where possible:

```
POST {baseUrl}/v1/chat/completions
{
  "model": "...",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "Context: [highlighted text]\n\nQuestion: [user message]" }
  ],
  "stream": true
}
```

Provider defaults:
| Provider | Base URL | Auth |
|----------|----------|------|
| OpenAI | `https://api.openai.com` | `Bearer {key}` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `Bearer {key}` |
| Ollama | `http://localhost:11434` | None |
| Custom | User-defined | `Bearer {key}` |

## Data Flow

1. User highlights text on a webpage
2. `content.js` captures text + XPath on `mouseup`
3. Message sent via `chrome.runtime.sendMessage()`
4. `background.js` forwards to side panel (or side panel listens directly)
5. `sidepanel.js` receives message, shows quote, focuses input
6. User types question and hits Enter/Send
7. `sidepanel.js` constructs messages array and calls LLM API
8. Response streams back token-by-token into the chat bubble
9. Conversation continues until user highlights new text or clears

## Key Technical Decisions

- **No build step**: Plain HTML/CSS/JS for zero tooling overhead. Load extension unpacked.
- **Streaming responses**: Uses `fetch` + `ReadableStream` for real-time token display.
- **OpenAI-compatible format**: Works with OpenAI, Gemini (via compatibility layer), Ollama, and any OpenAI-compatible endpoint out of the box.
- **chrome.storage.sync**: Settings persist across devices if user is signed into Chrome.
- **Markdown rendering**: Lightweight marked.js library bundled for rendering LLM responses.

## How to Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dia-chrome/` folder
5. Pin the extension icon in the toolbar
6. Click the icon to open the side panel
7. Highlight text on any page and start chatting
