

import type { Request, Response } from 'express'
import OpenAI from "openai"

const modelClient = new OpenAI({
    baseURL: "https://api.deepseek.com", 
    apiKey: process.env.DEEPSEEK_API_KEY, 
});

const modelName = "deepseek-v4-flash"
const instructions = "You are an expert exam revision assistant. Output ONLY valid JSON matching the requested format exactly. No markdown, no code blocks, no extra text."

const prompt = `Based on the summary of mistakes provided, generate a multiple-choice quiz targeting those weak areas.

Output as a JSON array:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "answer": 0,
    "explanation": "..."
  }
]

Generate 5 questions. Focus specifically on the concepts the user struggled with. Each question should have exactly 4 options.`

const prompt_revision = `Based on the summary of mistakes provided, generate a revision report targeting those weak areas.

Output as a JSON object with a "topics" key:
{
  "topics": [
    {
      "title": "Topic 1",
      "points": ["Key point 1", "Key point 2", "Key point 3"]
    },
    {
      "title": "Topic 2",
      "points": ["Key point 1", "Key point 2"]
    }
  ]
}

Include 2-4 topics. Each topic should have 2-3 concise, actionable points. Focus on concepts the user struggled with.`

export const handleRevision = async (req: Request, res: Response) => {

    const { summarizedMistakes, type }  = req.body
    try {

        if (type == "mcq-revision") {
            const response = await modelClient.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: instructions },
                    { role: 'user', content: summarizedMistakes + prompt }
                ],
                response_format: { type: 'json_object' }
            })

            res.json({ content: response.choices[0].message.content })

        } else {
            const response = await modelClient.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: instructions },
                    { role: 'user', content: summarizedMistakes + prompt_revision }
                ],
                response_format: { type: 'json_object' }
            })

            res.json({ content: response.choices[0].message.content })
        }
       
    } catch (err) {
        console.log("Error: ", err)

        res.status(500).json({ error: err })
    }

}