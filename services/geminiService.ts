
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 1. วิจัยตลาดและค้นหา Pain Points / Solutions (ภาษาไทย)
 */
export const performResearch = async (market: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็น Viral Niche Algorithmic Scout. วิเคราะห์ตลาด ${market} ในปี 2025.
    ระบุโอกาสที่ยังไม่มีใครทำ (White Space).
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
    contents: `รับบทเป็น Solution Architect & Context Engineer. ออกแบบโครงสร้างซอฟต์แวร์สำหรับ "${projectData.name}".
    ข้อมูลเบื้องต้น: ${JSON.stringify(projectData)}
    
    สร้างรายละเอียดดังนี้ (เป็นภาษาไทย):
    1. PRD: รายละเอียดความต้องการทางเทคนิคและธุรกิจ
    2. Context: การวิเคราะห์บริบทเทคนิค ข้อจำกัด และ Dependencies
    3. Sitemap: โครงสร้างหน้าเว็บ และ User Journey
    4. Database Schema: รายละเอียดตารางและความสัมพันธ์ (Text-based ERD)
    
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
 * 3. ผลิตซอร์สโค้ดและเอกสารทั้งหมด (9 ไฟล์มาตรฐาน)
 */
export const generateCode = async (projectData: any, technicalPlan: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `รับบทเป็นกองทัพ AI Software Factory. ผลิตชุดไฟล์ซอฟต์แวร์มาตรฐานสากลสำหรับ "${projectData.name}".
    
    รายละเอียดโปรเจกต์: ${JSON.stringify(projectData)}
    แผนงานเทคนิค: ${JSON.stringify(technicalPlan)}
    
    คุณต้องส่งไฟล์กลับมาให้ครบถ้วน 9 ไฟล์ ดังนี้ (เอกสาร .md ต้องเป็นภาษาไทย):
    1. App.tsx: โค้ด React + Tailwind ที่ทำงานได้จริงและสวยงาม
    2. index.tsx: Entry point
    3. README.md: คู่มือการใช้งาน รวม Pain Points และ Solutions อย่างละเอียด
    4. prd.md: เอกสาร Product Requirements จาก Agent PRD
    5. context.md: เอกสาร Context Engineering จาก Agent Context
    6. sitemap.md: รายละเอียด Sitemap และ Flow จาก Agent Sitemap
    7. database.md: รายละเอียด Database Schema จาก Agent Database
    8. agent.md: บันทึกประวัติการตัดสินใจและตรรกะของกองทัพ Agent ในการผลิตครั้งนี้
    9. presentation.md: เนื้อหา Pitch Deck สำหรับผู้นำเสนอ
    
    โครงสร้างไฟล์ต้องเป็นมืออาชีพ โค้ดต้องสะอาดและเป็นไปตามหลัก Software Architecture`,
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
    contents: `รับบทเป็น Inspector Agent (Auditor). ตรวจสอบชุดไฟล์งานนี้: ${JSON.stringify(filePaths)}.
    
    เกณฑ์การตรวจสอบ:
    - ต้องมี prd.md, context.md, sitemap.md, database.md, agent.md ครบ 5 ไฟล์หลักฝ่ายแผน
    - ต้องมี App.tsx และ index.tsx สำหรับการรันระบบ
    - README.md และ presentation.md ต้องครบถ้วน
    - ตรวจสอบว่ามีเนื้อหา Pain Points และ Solutions อยู่ในเอกสารหรือไม่
    
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
