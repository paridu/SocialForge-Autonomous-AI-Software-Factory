
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

export const performResearch = async (market: string) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Viral Niche Algorithmic Scout. Analyze high-growth, underserved niches in social media specifically for ${market} in the 2025 landscape. 
    Identify specific "white space" opportunities where current platforms fail (e.g., hyper-local creator economies, privacy-first vertical communities, or AI-collaborative social tools).
    Return a structured project concept including a catchy name, the specific algorithmic advantage it leverages (e.g., interest-based graph vs social graph), and 3 key features including a specific mechanism for sub-1-second user gratification.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          concept: { type: Type.STRING },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "concept", "features"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const generateCode = async (projectName: string, concept: string, features: string[]) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Act as a Rapid Social Interface Engineer. Generate full production-ready React source code and comprehensive documentation for "${projectName}". 
    Concept: ${concept}
    Features: ${features.join(', ')}
    
    REQUIRED FILES:
    1. App.tsx: Full React code with Tailwind CSS.
    2. README.md: Detailed documentation including:
       - Problem/Pain Points: Why this project needs to exist.
       - Solution: How this project solves those specific problems.
       - Technical Stack: React, Tailwind, Gemini API.
    3. presentation.md: A pitch deck/outline for investors/users.
    4. index.tsx: Standard entry point.
    
    Technical Priorities:
    - UI: Tailwind CSS with a "Dark Mode First" high-fidelity social aesthetic.
    - Viral Tech: Integrated Web Share API hooks and social metadata.
    
    Return a list of files with their paths and full content.`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["path", "content"]
            }
          }
        },
        required: ["files"]
      }
    }
  });
  return JSON.parse(response.text).files;
};

export const auditCode = async (files: Array<{ path: string; content: string }>) => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Trust, Safety & Security Auditor. Audit this social media source code and documentation for:
    1. Exposure of PII (Personally Identifiable Information).
    2. Vulnerability to automation (botting/scraping).
    3. Content moderation hooks.
    Code: ${JSON.stringify(files)}. Provide a pass/fail status and specific remediation notes.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, description: "Pass or Fail" },
          notes: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};
