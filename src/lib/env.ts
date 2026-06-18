import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    PINECONE_API_KEY: z.string().min(1, "PINECONE_API_KEY is missing"),
    PINECONE_INDEX :z.string(),
    // UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    // UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    // GOOGLE_CLIENT_ID: z.string().optional(),
    // GOOGLE_CLIENT_SECRET: z.string().optional(),
    // GITHUB_CLIENT_ID: z.string().optional(),
    // GITHUB_CLIENT_SECRET: z.string().optional(),
    OPENROUTER_API_KEY:z.string().min(1,"OPENROUTER_API_KEY is misiing")
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    // UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    // UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    // GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX : process.env. PINECONE_INDEX,
    OPENROUTER_API_KEY : process.env. OPENROUTER_API_KEY
  }
});
