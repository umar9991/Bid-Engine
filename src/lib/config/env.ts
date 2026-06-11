import { z } from "zod";

/** Validate environment at startup so failures are explicit, not silent. */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  DISCORD_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ?? "",
});
