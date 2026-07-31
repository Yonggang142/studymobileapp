
import type { Request, Response } from 'express'
import OpenAI from "openai"
import fs from 'fs'
import { PDFParse } from 'pdf-parse'

const modelClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const typeToPrompt: Record<string, string> = {
    answers: `Look at the questions in this image. Output ONLY the answers in clear numerical order.

Output as a JSON object:
{
  "summary": "Brief 2-3 sentence summary of what this material covers",
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": 0,
      "explanation": "..."
    }
  ]
}`,

    mcq: `Based on the content in this image, generate a multiple-choice quiz.

Output as a JSON object:
{
  "summary": "Brief 2-3 sentence summary of what this material covers",
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": 0,
      "explanation": "..."
    }
  ]
}

Generate 5 questions. Cover key concepts, similar in vibe to the file provided, not trivia. Each question should have multiple options.`,

    knowledge: `Summarize the key knowledge points from this content. 

Output as a JSON object:
{
  "summary": "Brief 2-3 sentence summary of what this material covers",
  "topics": [
    {
      "title": "Topic 1",
      "points": ["Key point 1", "Key point 2", ...]
    },
    {
      "title": "Topic 2",
      "points": ["Key point 1", "Key point 2", ...]
    }
  ]
}

Include 2-4 topics. Each topic should have 2-3 concise, well-explained points. Focus on concepts that would appear in an exam, not filler.`,

    marking: `You are grading a student's work against an answer key.

1. Compare each student answer with the corresponding answer key answer.
2. If the student's answer matches the correct answer exactly (or is clearly the same choice), mark isCorrect: true. DO NOT mark matching answers as wrong.
3. Give a score (e.g. 3/5) and brief feedback.
4. Identify which topics the student is weak in.

Output as a JSON object:
{
  "summary": "Brief 2-3 sentence summary of what this test material covers",
  "score": "3/5",
  "Non Attempted": 0,
  "results": [
    {
      "question": "...",
      "studentAnswer": "...",
      "correctAnswer": "...",
      "isCorrect": true,
      "explanation": "..."
    }
  ],
  "feedback": "Overall feedback here..."
}`,
 markingNoAnswer: `You are grading a student's work. There is NO answer key provided — you must determine the correct answers yourself from the question content.

    1. For each question, figure out the correct answer.
    2. Compare the student's answer to the correct answer. If they match, mark isCorrect: true.
    3. Give a score (e.g. 3/5) and brief feedback.
    4. Identify which topics the student is weak in.

    Output as a JSON object:
    {
    "summary": "Brief 2-3 sentence summary of what this test material covers",
    "score": "3/5",
    "Non Attempted": 0,
    "results": [
        {
        "question": "...",
        "studentAnswer": "...",
        "correctAnswer": "...",
        "isCorrect": true,
        "explanation": "..."
        }
    ],
    "feedback": "Overall feedback here..."
    }`
}

const instructions = "You are an expert exam preparation assistant. Analyze the provided image carefully. Output ONLY valid JSON matching the requested format exactly. Do not include markdown formatting, code blocks, or any text outside the JSON."
const modelName = "gpt-4o-mini"  // supports image_url vision

const mimeFromFilename = (name: string): string | null => {
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg',
        png: 'image/png', gif: 'image/gif',
        webp: 'image/webp', bmp: 'image/bmp',
    }
    return map[ext] ?? null
}

export const handleAnalysis = async (req: Request, res: Response) => {
    try {

        
        const { type } = req.body
        
        const prompt = typeToPrompt[type]
  

        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        const file = files?.['file']?.[0]
        const answerFile = files?.['answerFile']?.[0]

        if (!file) {
            res.status(400).json({ error: "No file uploaded" })
            return
        }

        const buildFileContent = async (f: Express.Multer.File, label?: string): Promise<OpenAI.Chat.Completions.ChatCompletionContentPart[]> => {
            const isPdf = f.mimetype === 'application/pdf'
            if (isPdf) {
                const pdfBuffer = fs.readFileSync(f.path)
                const parser = new PDFParse({ data: pdfBuffer })
                const { text: pdfText } = await parser.getText()
                const fileLabel = label ? `[${label}]\n\n` : 'File content:\n\n'
                return [{ type: 'text', text: fileLabel + pdfText }]
            } else {
                const base64 = fs.readFileSync(f.path, { encoding: 'base64' })
                const fileLabel = label ? `[${label}]` : ''
                // Infer MIME type from extension — multer's mimetype comes from the
                // request header, which may be application/octet-stream for signed URLs
                const mime = mimeFromFilename(f.originalname) ?? f.mimetype
                return[{ type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }]
             
            }
        }

        const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: 'text', text: prompt }
        ]

        if (type === 'marking') {
            if (!answerFile) {
                res.status(400).json({ error: "Answer key file required for marking" })
                return
            }
            userContent.push(...(await buildFileContent(file, 'STUDENT WORK')))
            userContent.push(...(await buildFileContent(answerFile, 'ANSWER KEY')))
        } else {
            userContent.push(...(await buildFileContent(file)))
        }

        const response = await modelClient.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: instructions },
                { role: 'user', content: userContent }
            ],
        })

        const raw = JSON.parse(response.choices[0].message.content || '{}')
        res.json({
            content: JSON.stringify(raw),
            summary: raw.summary || ''
        })



    } catch (err) {
        console.log("Error: ", err)
        res.status(500).json({ error: "Analysis error" })
    }
}
