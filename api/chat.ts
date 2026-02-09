// Vercel Serverless Function
// Types are provided by Vercel at build time
import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & { body: any; query: any };
type VercelResponse = ServerResponse & {
    status: (code: number) => VercelResponse;
    json: (data: any) => void
};

// Server-side only - API key never exposed to browser
const API_KEY = process.env.GEMINI_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check API key is configured
    if (!API_KEY) {
        return res.status(500).json({
            error: 'AI Tutor is not configured. Please add GEMINI_API_KEY to environment variables.'
        });
    }

    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Construct the prompt
        const prompt = `
You are an expert NCERT-focused AI tutor for Class 11-12 students preparing for NEET/JEE.

CURRENT CONTEXT:
${context || 'User is on the curriculum dashboard.'}

STUDENT'S QUESTION:
${message}

INSTRUCTIONS:
- Answer based on NCERT textbooks (Physics, Chemistry, Biology)
- Be concise but comprehensive (2-4 paragraphs max)
- Use simple language with analogies when helpful
- Include relevant formulas when applicable
- If asked about the simulation, explain what they're seeing
- For numerical problems, show step-by-step solution
- Relate concepts to real-world applications when relevant
`;

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return res.status(500).json({ error: 'Failed to get AI response' });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';

        return res.status(200).json({ response: text });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
}
