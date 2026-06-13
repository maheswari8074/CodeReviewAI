const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const reviewCode = async (code, language = "auto") => {
  const prompt = `You are an expert code reviewer. Analyze the following ${language} code and provide a detailed review.

Return your response ONLY as a valid JSON object with this exact structure, no extra text, no markdown backticks:

{
  "overallScore": <number 0-100>,
  "readability": <number 0-100>,
  "performance": <number 0-100>,
  "security": <number 0-100>,
  "maintainability": <number 0-100>,
  "timeComplexity": "<Big O notation>",
  "spaceComplexity": "<Big O notation>",
  "summary": "<2-3 sentence overall summary>",
  "issues": [
    {
      "severity": "<critical|warning|suggestion>",
      "category": "<Bug|Performance|Security|Style|Logic>",
      "title": "<short title>",
      "description": "<what the issue is>",
      "line": <line number or null>,
      "suggestion": "<how to fix it>"
    }
  ],
  "refactoring": [
    {
      "before": "<original code snippet>",
      "after": "<improved code snippet>",
      "explanation": "<why this is better>"
    }
  ]
}

Code to review:
\`\`\`${language}
${code}
\`\`\``;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const rawText = response.choices[0].message.content;

  // Clean and parse JSON
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return parsed;
};

module.exports = { reviewCode };