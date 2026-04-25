/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** LLM Provider - The AI provider to use for grammar correction */
  provider:
    | "anthropic"
    | "openai"
    | "openrouter"
    | "google"
    | "groq"
    | "ollama";
  /** API Key - Your API key for the selected provider. Not required for Ollama — enter any value. */
  apiKey: string;
  /** Model - Model ID to use (e.g. claude-sonnet-4-20250514, gpt-4o, gemini-2.0-flash) */
  model?: string;
  /** Extra Instructions - Optional instructions appended to the system prompt (e.g. "Use British English" or "Keep it formal") */
  userInstruction?: string;
  /** Custom Base URL - Optional base URL override (useful for OpenRouter or self-hosted endpoints) */
  customBaseURL?: string;
};

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences;

declare namespace Preferences {
  /** Preferences accessible in the `fix-grammar` command */
  export type FixGrammar = ExtensionPreferences & {};
}

declare namespace Arguments {
  /** Arguments passed to the `fix-grammar` command */
  export type FixGrammar = {};
}
