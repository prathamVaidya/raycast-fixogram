# Fixogram

Fix grammar, spelling, and punctuation of any text instantly — copy, trigger, paste. Powered by your choice of AI provider.

## How It Works

1. Copy any text to your clipboard
2. Trigger **Fixogram** (default: `Cmd+Shift+V`)
3. The corrected text is pasted directly into your frontmost app

No UI. No interruptions. Just fixed text.

## Setup

Open Raycast preferences for Fixogram and configure:

| Preference | Description |
|---|---|
| **LLM Provider** | Choose from Anthropic, OpenAI, OpenRouter, Google, Groq, or Ollama |
| **API Key** | Your API key for the selected provider |
| **Model** | Model ID to use (leave blank for provider default) |
| **Use Raycast AI** | Use Raycast's built-in AI if you have Raycast Pro (ignores provider/key) |
| **Extra Instructions** | Optional instructions appended to the prompt (e.g. "Use British English") |
| **Custom Base URL** | Override the API endpoint (useful for OpenRouter or self-hosted models) |

## Supported Providers

| Provider | Default Model |
|---|---|
| Anthropic | `claude-haiku-4-5-20251001` |
| OpenAI | `gpt-4.1-nano` |
| OpenRouter | `openai/gpt-4.1-nano` |
| Google | `gemini-2.5-flash-lite` |
| Groq | `llama-3.3-70b-versatile` |
| Ollama (local) | `llama3.2` |

You can override the model by typing any valid model ID in the **Model** preference field.

## Raycast Pro

If you have Raycast Pro, enable **Use Raycast AI** in preferences to use Raycast's built-in AI without needing an API key. You can still enter a placeholder value in the API Key field.

## Ollama (Local Models)

To use Ollama:
1. Install [Ollama](https://ollama.com) and pull a model (e.g. `ollama pull llama3.2`)
2. Select **Ollama (local)** as the provider
3. Enter any value for the API Key
4. Set the model name to match your pulled model
