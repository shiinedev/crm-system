import { generateText } from "ai"
import { MODEL, openRouter } from "../client"



export const generateAiText = async (prompt:string) => {
  const result = await generateText({
    model: openRouter.chat(MODEL),
    prompt,
  })
  return result


}
