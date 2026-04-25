/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `fix-grammar` command */
  export type FixGrammar = ExtensionPreferences & {
  /** LLM Provider - The AI provider to use for grammar correction */
  "provider": "anthropic" | "openai" | "openrouter" | "google" | "groq",
  /** API Key - Your API key for the selected provider */
  "apiKey": string,
  /** Model - Model ID to use (e.g. claude-sonnet-4-20250514, gpt-4o, gemini-2.0-flash) */
  "model": string,
  /** Custom Base URL - Optional base URL override (useful for OpenRouter or self-hosted endpoints) */
  "customBaseURL"?: string
}
}

declare namespace Arguments {
  /** Arguments passed to the `fix-grammar` command */
  export type FixGrammar = {}
}

