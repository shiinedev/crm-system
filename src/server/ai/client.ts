import "server-only"
import {createOpenRouter} from "@openrouter/ai-sdk-provider"
import { env } from "@/lib/env"


export const openRouter = createOpenRouter({
    appName: "chat-bot",
    apiKey: env.OPENROUTER_API_KEY,
    compatibility: "strict"
})
export const MODEL = "nex-agi/nex-n2-pro:free" as const
export const EMPPED_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free" as const
