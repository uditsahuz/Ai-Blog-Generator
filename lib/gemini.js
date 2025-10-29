import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Use the latest Gemini 2.5 Flash model
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
