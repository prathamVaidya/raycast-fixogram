import {
  Clipboard,
  showHUD,
  showToast,
  Toast,
  getPreferenceValues,
} from "@raycast/api";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

interface Preferences {
  provider: "anthropic" | "openai" | "openrouter" | "google" | "groq";
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
};

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

    await Clipboard.paste(fixed);
    toast.hide();
    await showHUD("Grammar fixed & pasted");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    toast.style = Toast.Style.Failure;
    toast.title = message;
  }
}
