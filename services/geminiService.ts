
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const performResearch = async (market: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็น Viral Niche Algorithmic Scout. วิเคราะห์ตลาด ${market} ในปี 2025.
    ระบุโอกาสที่ยังไม่มีใครทำ (White Space).
    ตอบกลับในรูปแบบ JSON ภาษาไทย:
    - name: ชื่อโครงการ
    - concept: แนวคิดหลัก
    - painPoints: รายการปัญหาหลัก 3 ข้อ (Array ของ String)
    - solutions: วิธีการแก้ปัญหา 3 ข้อ (Array ของ String)
    - presentation: สรุปสั้นๆ สำหรับนำเสนอ (String)
    - features: รายการฟีเจอร์หลัก (Array ของ String)`,
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

export const generateTechnicalPlan = async (projectData: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็น Senior Solution Architect & Context Engineer. ออกแบบโครงสร้างทางเทคนิคสำหรับโครงการ "${projectData.name}".
    ข้อมูลโครงการ: ${JSON.stringify(projectData)}
    กรุณาสร้าง:
    1. PRD (Product Requirements Document) อย่างละเอียด
    2. Context Analysis (สภาพแวดล้อมทางเทคนิคและข้อจำกัด)
    3. Sitemap (โครงสร้างหน้าเว็บและการไหลเวียนของผู้ใช้)
    4. Database Schema (โครงสร้างฐานข้อมูล ER Diagram เชิงข้อความ)
    ตอบกลับเป็นภาษาไทยในรูปแบบ JSON`,
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

export const generateCode = async (projectData: any, technicalPlan: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `รับบทเป็นกองทัพ AI Software Factory (Lead Engineer & Scribe). ผลิตซอฟต์แวร์มาตรฐานสูงสำหรับ "${projectData.name}".
    
    รายละเอียดโปรเจกต์: ${JSON.stringify(projectData)}
    แผนงานเทคนิค: ${JSON.stringify(technicalPlan)}
    
    คุณต้องสร้างไฟล์ต่อไปนี้ให้ครบถ้วน (ภาษาไทยในส่วนเอกสาร):
    1. App.tsx: โค้ด React + Tailwind CSS สำหรับ MVP ที่ใช้งานได้จริง
    2. prd.md: เอกสาร Product Requirements
    3. context.md: เอกสารวิเคราะห์บริบททางเทคนิค (Context Engineering)
    4. sitemap.md: แผนผังโครงสร้างหน้าเว็บ (Sitemap)
    5. database.md: รายละเอียดการออกแบบฐานข้อมูล (Database Design)
    6. agent.md: บันทึกการทำงานและตรรกะของ AI Agents แต่ละตัวที่ใช้ผลิตโครงการนี้
    7. README.md: คู่มือรวม Pain Points, Solutions และวิธีใช้งาน
    8. presentation.md: เนื้อหาสำหรับนำเสนอ (Pitch Deck)
    9. index.tsx: จุดเริ่มต้นของแอปพลิเคชัน
    
    เน้นความเป็นมืออาชีพและโครงสร้างไฟล์ที่ถูกต้องตามมาตรฐาน Software Engineering`,
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

export const auditCode = async (files: any[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `รับบทเป็น Structural Auditor & Inspector. ตรวจสอบชุดไฟล์ซอฟต์แวร์นี้: ${JSON.stringify(files.map(f => f.path))}.
    
    กฎการตรวจสอบ:
    - ต้องมีไฟล์ prd.md, context.md, sitemap.md, database.md, agent.md ครบถ้วน
    - README.md ต้องมีหัวข้อ Pain Points และ Solutions
    - App.tsx ต้องไม่มี Error พื้นฐาน
    
    ตอบกลับเป็น JSON ภาษาไทย (status: "Pass" หรือ "Fail", notes: รายละเอียดคำแนะนำ)`,
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
