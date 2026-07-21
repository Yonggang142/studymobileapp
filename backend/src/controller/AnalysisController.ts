
import type { Request, Response } from 'express'
import OpenAI from "openai"
import fs from 'fs'

const modelClient = new OpenAI({
    baseURL: "https://api.deepseek.com", 
    apiKey: process.env.DEEPSEEK_API_KEY, 
});

const typeToPrompt: Record<string, string> = {
    answer: `Look at the questions in this image. Output ONLY the answers in clear numerical order.

Output as a JSON array:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "answer": 0,
    "explanation": "..."
  }
]

If a question has multiple parts (a, b, c), label them as 1a, 1b, 1c.`,

    mcq: `Based on the content in this image, generate a multiple-choice quiz.

Output as a JSON array:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "answer": 0,
    "explanation": "..."
  }
]

Generate 5 questions. Cover key concepts, similar in vibe to the file provided, not trivia. Each question should have multiple options.`,

    knowledge: `Summarize the key knowledge points from this content. 

Output as a JSON object:
{
  "title": "Brief topic title",
  "points": [
    "Key point 1 with explanation",
    "Key point 2 with explanation",
    ...
  ]
}

Include 2 - 3 concise, well-explained points. Focus on concepts that would appear in an exam, not filler.`
}

const instructions = "You are an expert exam preparation assistant. Analyze the provided image carefully. Output ONLY valid JSON matching the requested format exactly. Do not include markdown formatting, code blocks, or any text outside the JSON."
const modelName = "deepseek-v4-flash"

export const handleAnalysis = async (req: Request, res: Response) => {
    try {
        const { type } = req.body
        const uploadedFile = req.file
        const prompt = typeToPrompt[type]
  
        if (uploadedFile) {
            const base64 = fs.readFileSync(uploadedFile.path, { encoding: 'base64' })
            const response = await modelClient.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: instructions },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: `data:${uploadedFile.mimetype};base64,${base64}` } }
                        ]
                    }
                ],
                response_format: { type: 'json_object' }
            })

            res.json({ content: response.choices[0].message.content })
            return
        }

        res.status(400).json({ error: "No file uploaded" })



    } catch (err) {
        console.log("Error: ", err)
        res.status(500).json({ error: "Analysis error" })
    }
}
