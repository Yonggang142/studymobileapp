

import type { Request, Response } from 'express'
import OpenAI from "openai"

const modelClient = new OpenAI({
    baseURL: "https://api.deepseek.com", 
    apiKey: process.env.DEEPSEEK_API_KEY, 
});


const modelName = "deepseek-v4-flash"
const instructions = "You are an expert exam preparation assistant. Output ONLY valid JSON. No markdown, no code blocks, no extra text."

const prompt = `Analyze the questions below. Identify the underlying concepts the user struggles with and excels at. Be specific — name concrete topics, not vague categories.

Output JSON:
{
  "weak_at": ["concept 1", "concept 2"],
  "strong_at": ["concept 1", "concept 2"],
  "summary": "Summary of their overall performance pattern"
}

Rules:
- 1-3 items per array
- Name specific concepts (e.g. "Newton's laws" not "physics")
- If no wrong answers, weak_at = []
- If no correct answers, strong_at = []`

export const handleLogging = async (req: Request, res: Response) => {
    try {
        const { wrong_questions, correct_questions } = req.body

        const wrongStr = wrong_questions?.length
            ? `Questions the user got WRONG:\n${wrong_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
            : 'No wrong answers.'

        const correctStr = correct_questions?.length
            ? `Questions the user got RIGHT:\n${correct_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
            : 'No correct answers.'

        const response = await modelClient.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: instructions },
                { role: 'user', content: `${wrongStr}\n\n${correctStr}\n\n${prompt}` }
            ],
            response_format: { type: 'json_object' }
        })

        res.json({ content: response.choices[0].message.content })

    } catch (err) {
        console.log("Error: ", err)

        res.status(500).json({ error: err })
    }

}