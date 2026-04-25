import {
  AI,
  Clipboard,
  environment,
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
  useRaycastAI: boolean;
  model?: string;
  userInstruction?: string;
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

const BASE_SYSTEM_PROMPT =
  "Fix grammar, spelling, and punctuation. Return only the corrected text. Do not explain changes. Preserve the original tone and meaning.";

function buildSystemPrompt(userInstruction?: string): string {
  if (!userInstruction?.trim()) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}\n\nAdditional instructions: ${userInstruction.trim()}`;
}

const DEFAULT_MODEL_FOR_RAYCAST_AI = AI.Model["OpenAI_GPT-4.1_nano"];

const DEFAULT_MODELS: Record<Preferences["provider"], string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4.1-nano",
  openrouter: "openai/gpt-4.1-nano",
  google: "gemini-2.5-flash-lite",
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

  const content = await Clipboard.read();
  if (content.file || !content.text?.trim()) {
    await showHUD(content.file ? "Clipboard contains a file or image, not text" : "No text in clipboard");
    return;
  }
  const text = content.text;

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: randomLoadingMessage(),
  });

  try {
    let fixed: string;

    if (prefs.useRaycastAI && environment.canAccess(AI)) {
      fixed = await AI.ask(
        `${buildSystemPrompt(prefs.userInstruction)}\n\nText to fix:\n${text}`,
        { creativity: "none", model: DEFAULT_MODEL_FOR_RAYCAST_AI },
      );
    } else {
      const model = buildModel(prefs);
      const result = await generateText({
        model,
        system: buildSystemPrompt(prefs.userInstruction),
        prompt: text,
      });
      fixed = result.text;
    }

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
