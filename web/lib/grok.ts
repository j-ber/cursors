import { createXai } from "@ai-sdk/xai";
import { generateText, Output } from "ai";
import { z } from "zod";

export const GROK_MODEL = "grok-4.6";
export const GROK_MODEL_FALLBACK = "grok-4-fast";

export const recommendationSchema = z.object({
  market_id: z.string(),
  as_of: z.string(),
  verdict: z.enum(["aligned", "diverged"]),
  suggested_side: z.enum(["YES", "NO", "WATCH"]),
  divergence_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  explanation: z.string().min(1),
  supporting_reasons: z.array(z.string()),
  counterargument: z.string().min(1),
  sources: z.array(z.string()),
  flagged: z.boolean(),
});

export type RecommendationDraft = z.infer<typeof recommendationSchema>;

export function grokProvider(apiKey: string) {
  return createXai({ apiKey });
}

export async function grokObject<T>(opts: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  name?: string;
}): Promise<T> {
  const xai = grokProvider(opts.apiKey);
  const { output } = await generateText({
    model: xai(opts.model),
    system: opts.system,
    prompt: opts.prompt,
    output: Output.object({
      name: opts.name ?? "result",
      schema: opts.schema,
    }),
  });
  if (output == null) throw new Error(`${opts.model} returned no object`);
  return output;
}

export async function grokText(opts: {
  apiKey: string;
  model?: string;
  prompt: string;
}): Promise<string> {
  const xai = grokProvider(opts.apiKey);
  const { text } = await generateText({
    model: xai(opts.model ?? GROK_MODEL),
    prompt: opts.prompt,
  });
  if (!text.trim()) throw new Error("Grok returned empty text");
  return text;
}
