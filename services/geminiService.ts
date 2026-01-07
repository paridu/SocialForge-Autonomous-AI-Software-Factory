
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 1. วิจัยตลาดและค้นหา Pain Points / Solutions (ภาษาไทย)
 */
export const performResearch = async (market: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็น Nexus Echo: Viral Niche Algorithmic Scout. วิเคราะห์ตลาด ${market} ในปี 2025.
    มองหาโอกาสที่ซ่อนอยู่ในชุมชนออนไลน์แบบกระจายศูนย์.
    ตอบกลับในรูปแบบ JSON ภาษาไทยเท่านั้น:
    - name: ชื่อโครงการสุดล้ำ
    - concept: แนวคิดหลักที่ทำให้เป็นไวรัล
    - painPoints: รายการปัญหาหลักของผู้ใช้ 3-5 ข้อ (Array)
    - solutions: วิธีแก้ปัญหาด้วยเทคโนโลยี AI/Social 3-5 ข้อ (Array)
    - presentation: สรุปใจความสำคัญสำหรับการนำเสนอใน 2 ประโยค
    - features: รายการฟีเจอร์หลักที่ต้องมีใน MVP (Array)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          concept: { type: Type.STRING },
          painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          solutions: { type: Type.ARRAY, items: { type: Type.STRING } },
          presentation: { type: Type.STRING },
          features: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "concept", "painPoints", "solutions", "presentation", "features"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * 2. วางแผนเชิงเทคนิค (PRD, Context, Sitemap, DB) (ภาษาไทย)
 */
export const generateTechnicalPlan = async (projectData: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็นทีมวางแผนของ NexusForge (Agent PRD, Context, Sitemap, Database). 
    ร่วมกันออกแบบโครงสร้างซอฟต์แวร์สำหรับโครงการ "${projectData.name}".
    ข้อมูลเบื้องต้นจาก Nexus Echo: ${JSON.stringify(projectData)}
    
    สร้างรายละเอียดดังนี้ (เป็นภาษาไทย):
    1. PRD (จาก Agent PRD): รายละเอียดความต้องการทางเทคนิคและธุรกิจ
    2. Context (จาก Agent Context): การวิเคราะห์บริบทเทคนิค ข้อจำกัด และ Dependencies
    3. Sitemap (จาก Agent Sitemap): โครงสร้างหน้าเว็บ และ User Journey
    4. Database Schema (จาก Agent Database): รายละเอียดตารางและความสัมพันธ์ (Text-based ERD)
    
    ตอบกลับในรูปแบบ JSON`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prd: { type: Type.STRING },
          context: { type: Type.STRING },
          sitemap: { type: Type.STRING },
          dbSchema: { type: Type.STRING }
        },
        required: ["prd", "context", "sitemap", "dbSchema"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * 3. ผลิตซอร์สโค้ดและเอกสารทั้งหมด (9 ไฟล์มาตรฐาน โดยใช้กองทัพ Agent)
 */
export const generateCode = async (projectData: any, technicalPlan: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `รับบทเป็นกองทัพ AI Software Factory ของ NexusForge. 
    แต่ละไฟล์ต้องถูกสร้างโดย Agent เฉพาะทางดังนี้:
    1. App.tsx (โดย Agent UI-Forge): React + Tailwind ที่ทำงานได้จริง สวยงาม และ Responsive
    2. index.tsx (โดย Agent Entry-Forge): Entry point ที่สะอาดและเชื่อมต่อกับ App.tsx อย่างถูกต้อง
    3. README.md (โดย Agent Readme): คู่มือภาษาไทยที่ครบถ้วน
    4. prd.md (โดย Agent PRD): เอกสาร PRD ภาษาไทย
    5. context.md (โดย Agent Context): เอกสาร Context ภาษาไทย
    6. sitemap.md (โดย Agent Sitemap): เอกสาร Sitemap ภาษาไทย
    7. database.md (โดย Agent Database): เอกสาร Database ภาษาไทย
    8. agent.md (โดย Agent Scribe): บันทึกกระวัติการตัดสินใจของแต่ละ Agent ในทีม
    9. presentation.md (โดย Agent Pitch-Deck): เนื้อหาสำหรับ Pitching ภาษาไทย
    
    รายละเอียดโปรเจกต์: ${JSON.stringify(projectData)}
    แผนงานเทคนิค: ${JSON.stringify(technicalPlan)}
    
    ตอบกลับในรูปแบบ JSON ที่บรรจุรายการไฟล์ทั้งหมด`,
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

/**
 * 4. ตรวจสอบความถูกต้องของโครงสร้าง (Structural Audit)
 */
export const auditCode = async (files: any[]) => {
  const filePaths = files.map(f => f.path);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็น Nexus Auditor. ตรวจสอบชุดไฟล์งานที่กองทัพ Agent ผลิตขึ้นมา: ${JSON.stringify(filePaths)}.
    
    เกณฑ์การตรวจสอบ:
    - ไฟล์ทั้งหมดต้องเป็นไปตามที่แต่ละ Agent ได้รับมอบหมาย (UI, Entry, Docs, Plans)
    - ไฟล์เอกสาร .md ต้องเป็นภาษาไทยและมีเนื้อหาครบถ้วน
    - โครงสร้างโค้ดต้องไม่มี Error เบื้องต้น
    
    ตอบกลับเป็น JSON ภาษาไทย (status: "Pass" หรือ "Fail", notes: รายละเอียดสาเหตุ)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          notes: { type: Type.STRING }
        },
        required: ["status", "notes"]
      }
    }
  });
  return JSON.parse(response.text);
};
