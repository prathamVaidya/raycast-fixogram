import {
  Clipboard,
  showHUD,
  showToast,
  Toast,
  getPreferenceValues,
} from "@raycast/api";
import { generateText, APICallError, RetryError } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

interface Preferences {
  provider:
    | "anthropic"
    | "openai"
    | "openrouter"
    | "google"
    | "groq"
    | "ollama";
  apiKey: string;
  model?: string;
  customBaseURL?: string;
}

const LOADING_MESSAGES = [
  "Fixing grammar…",
  "Pika Pika Chu…",
  "Untangling your sentences…",
  "Making you sound smarter…",
  "Consulting the grammar gods…",
  "Making your english teacher proud…",
  "Pretending to be Grammarly…",
  "Removing accidental Yoda speak…",
  "Adding commas you definitely forgot…",
  "Turning word soup into word salad…",
  "Saving you from embarrassing typos…",
  "Shakespeare mode: ON…",
  "Fixing what autocorrect destroyed…",
  "Polishing your prose…",
  "Teaching your text some manners…",
  "Saving you from grammar police…",
];

function randomLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

const SYSTEM_PROMPT =
  "Fix grammar, spelling, and punctuation. Return only the corrected text. Do not explain changes. Preserve the original tone and meaning.";

const DEFAULT_MODELS: Record<Preferences["provider"], string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  openrouter: "openai/gpt-4o",
  google: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
  ollama: "llama3.2",
};

function friendlyError(err: unknown): string {
  if (RetryError.isInstance(err)) {
    return friendlyError(err.lastError);
  }

  if (
    err instanceof TypeError &&
    /fetch|network|ENOTFOUND|ECONNREFUSED/i.test(err.message)
  ) {
    return "Network error — check your internet connection and try again.";
  }

  if (APICallError.isInstance(err)) {
    const { statusCode, message } = err;

    if (statusCode === 401)
      return "Invalid API key — open preferences and check your key.";
    if (statusCode === 403)
      return "Access denied — your API key may not have access to this model.";
    if (statusCode === 404)
      return `Model not found — "${message.match(/model[: ]+([^\s,]+)/i)?.[1] ?? "unknown"}" doesn't exist for this provider. Check your model ID in preferences.`;
    if (statusCode === 429) {
      if (/quota|billing|exceeded/i.test(message)) {
        return "API quota exceeded — check your plan and billing details.";
      }
      return "Rate limit reached — wait a moment and try again.";
    }
    if (statusCode === 400) {
      if (
        /too long|context.{0,20}window|max.{0,10}token|input.{0,10}length/i.test(
          message,
        )
      ) {
        return "Text is too long for this model's context window. Try with shorter text.";
      }
      return `Bad request: ${message}`;
    }
    if (statusCode !== undefined && statusCode >= 500) {
      return `Provider server error (${statusCode}) — not your fault. Try again in a moment.`;
    }
    return message;
  }

  if (err instanceof Error) return err.message;
  return String(err);
}

function buildModel(prefs: Preferences) {
  const modelId = prefs.model?.trim() || DEFAULT_MODELS[prefs.provider];

  switch (prefs.provider) {
    case "anthropic": {
      const client = createAnthropic({
        apiKey: prefs.apiKey,
        ...(prefs.customBaseURL ? { baseURL: prefs.customBaseURL } : {}),
      });
      return client(modelId);
    }
    case "openai": {
      const client = createOpenAI({
        apiKey: prefs.apiKey,
        ...(prefs.customBaseURL ? { baseURL: prefs.customBaseURL } : {}),
      });
      return client(modelId);
    }
    case "openrouter": {
      const baseURL =
        prefs.customBaseURL?.trim() || "https://openrouter.ai/api/v1";
      const client = createOpenAI({ apiKey: prefs.apiKey, baseURL });
      return client(modelId);
    }
    case "google": {
      const client = createGoogleGenerativeAI({
        apiKey: prefs.apiKey,
        ...(prefs.customBaseURL ? { baseURL: prefs.customBaseURL } : {}),
      });
      return client(modelId);
    }
    case "groq": {
      const baseURL =
        prefs.customBaseURL?.trim() || "https://api.groq.com/openai/v1";
      const client = createOpenAI({ apiKey: prefs.apiKey, baseURL });
      return client(modelId);
    }
    case "ollama": {
      const baseURL =
        prefs.customBaseURL?.trim() || "http://localhost:11434/v1";
      const client = createOpenAI({ apiKey: "ollama", baseURL });
      return client(modelId);
    }
    default:
      throw new Error(
        `Unknown provider: "${prefs.provider}". Check your extension preferences.`,
      );
  }
}

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();

  const text = await Clipboard.readText();
  if (!text?.trim()) {
    await showHUD("No text in clipboard");
    return;
  }

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: randomLoadingMessage(),
  });

  try {
    const model = buildModel(prefs);
    const { text: fixed } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: text,
    });

    if (!fixed?.trim()) {
      throw new Error("Model returned an empty response. Try again.");
    }

    await Clipboard.paste(fixed);
    toast.hide();
    await showHUD("Grammar fixed & pasted");
  } catch (err) {
    toast.style = Toast.Style.Failure;
    toast.title = friendlyError(err);
  }
}
