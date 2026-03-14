# Dia — Privacy Policy

**Last updated:** March 15, 2026

## What Dia Does

Dia is a browser extension that lets you highlight text on any webpage and ask questions about it using an LLM (Large Language Model) of your choice.

## Data Collection

Dia does **not** collect, store, or transmit any personal data. Specifically:

- **No analytics or tracking** — Dia contains no telemetry, analytics, or tracking code.
- **No accounts** — Dia does not require or create any user accounts.
- **No data stored on external servers** — All settings (API key, model preference) are stored locally in your browser via Chrome's storage API.

## Data Sent to Third Parties

When you highlight text and ask a question, the following is sent **directly from your browser** to the LLM API endpoint you have configured (e.g., Google Gemini, OpenAI, Ollama):

- The text you highlighted
- Your question
- Your conversation history for that session

This data is sent **only when you explicitly send a message**. Dia does not send any data in the background or without your action.

The privacy policy of your chosen LLM provider governs how they handle that data:
- [Google Gemini API Terms](https://ai.google.dev/terms)
- [OpenAI API Terms](https://openai.com/policies/terms-of-use)

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | To capture text you select on the current page |
| `sidePanel` | To display the chat interface as a side panel |
| `storage` | To save your settings (API key, model, preferences) locally |
| `contextMenus` | To add a right-click "Ask Dia" option on selected text |
| Host permission (`<all_urls>`) | To inject the text selection listener on any webpage you visit |

## Contact

If you have questions about this privacy policy, open an issue on the GitHub repository.
