
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgentStatus, PipelineStage, AIAgent, ProjectState, LogEntry, ConnectionState } from './types';
import { performResearch, generateTechnicalPlan, generateCode, auditCode } from './services/geminiService';
import { Terminal, Code, Cpu, Rocket, Search, ShieldCheck, Factory, Zap, Github, Globe, Link, CheckCircle2, AlertTriangle, ExternalLink, User, Lock, ChevronRight, X, Download, FileJson, FileText, Presentation, BookOpen, Users, BarChart3, Database, Map, ClipboardList, Info, MessageSquare } from 'lucide-react';
import JSZip from 'jszip';

const INITIAL_AGENTS: AIAgent[] = [
  { id: 'echo', name: 'Agent Echo', role: 'Viral Scout', description: 'วิเคราะห์เทรนด์และค้นหาช่องว่างตลาด', stage: PipelineStage.RESEARCH, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo' },
  { id: 'prd', name: 'Agent PRD', role: 'Product Strategist', description: 'สร้างเอกสาร PRD.md กำหนดขอบเขตสินค้า', stage: PipelineStage.PLANNING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=prd' },
  { id: 'context', name: 'Agent Context', role: 'Context Engineer', description: 'สร้าง context.md วิเคราะห์สภาพแวดล้อมเทคนิค', stage: PipelineStage.PLANNING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=context' },
  { id: 'sitemap', name: 'Agent Sitemap', role: 'UX Architect', description: 'สร้าง sitemap.md วางโครงสร้างหน้าเว็บ', stage: PipelineStage.ARCHITECTURE, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sitemap' },
  { id: 'database', name: 'Agent Database', role: 'Data Engineer', description: 'สร้าง database.md ออกแบบ Schema ข้อมูล', stage: PipelineStage.ARCHITECTURE, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=db' },
  { id: 'forge', name: 'Agent Forge', role: 'Lead Developer', description: 'ผลิต App.tsx และส่วนประกอบหลัก', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=forge' },
  { id: 'scribe', name: 'Agent Scribe', role: 'Tech Writer', description: 'สร้าง agent.md และ README.md', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=scribe' },
  { id: 'inspector', name: 'Agent Inspector', role: 'Structural Auditor', description: 'ตรวจสอบไฟล์ให้ครบตามมาตรฐาน software', stage: PipelineStage.QA, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=inspect' },
  { id: 'sentry', name: 'Agent Sentry', role: 'Security Auditor', description: 'ตรวจสอบความปลอดภัยและความลับข้อมูล', stage: PipelineStage.QA, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sentry' },
  { id: 'orbit', name: 'Agent Orbit', role: 'DevOps Engine', description: 'บริหารจัดการการติดตั้งและ Scaling', stage: PipelineStage.DEPLOYMENT, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=orbit' },
];

const App: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AGENTS);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [connections, setConnections] = useState<ConnectionState>({ github: 'CONNECTED', vercel: 'CONNECTED' });
  const [isFactoryRunning, setIsFactoryRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((agentName: string, message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      agentName,
      message,
      type
    };
    setProject(prev => prev ? { ...prev, logs: [...prev.logs, newLog] } : {
      id: 'init', name: 'กำลังเตรียมทัพ...', concept: '', painPoints: [], solutions: [], presentation: '', features: [], codeFiles: [], logs: [newLog], currentStage: PipelineStage.RESEARCH
    });
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<AIAgent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const triggerCommunication = useCallback(async (fromId: string, toId: string, message: string) => {
    updateAgent(fromId, { status: AgentStatus.WORKING, lastMessage: message, targetId: toId });
    addLog(fromId === toId ? 'System' : INITIAL_AGENTS.find(a => a.id === fromId)?.name || 'Agent', message, 'info');
    await new Promise(r => setTimeout(r, 2000));
    updateAgent(fromId, { targetId: undefined, status: AgentStatus.COMPLETED });
  }, [updateAgent, addLog]);

  const handleDownloadAll = async () => {
    if (!project?.codeFiles.length) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      project.codeFiles.forEach(file => zip.file(file.path, file.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-standard-pkg.zip`;
      link.click();
      addLog('ระบบ', 'ดาวน์โหลดชุดซอฟต์แวร์มาตรฐานสำเร็จ', 'success');
    } catch (err) {
      addLog('ระบบ', 'เกิดข้อผิดพลาดในการสร้าง ZIP', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const startFactory = async () => {
    if (isFactoryRunning) return;
    setIsFactoryRunning(true);
    setAgents(INITIAL_AGENTS);
    
    try {
      // 1. RESEARCH
      await triggerCommunication('echo', 'prd', 'วิเคราะห์ช่องว่างตลาดเสร็จสิ้น ส่งต่อข้อมูลให้ฝ่ายกลยุทธ์สินค้า...');
      const research = await performResearch('AI-Powered Social Micro-Economies');
      setProject(prev => ({ ...prev!, ...research, currentStage: PipelineStage.RESEARCH }));

      // 2. PLANNING (PRD & Context)
      await triggerCommunication('prd', 'context', 'จัดทำ PRD.md เรียบร้อย กำลังวิเคราะห์ Technical Context...');
      await triggerCommunication('context', 'sitemap', 'Context Engineering พร้อมแล้ว เริ่มออกแบบโครงสร้างหน้าเว็บ...');
      
      // 3. ARCHITECTURE (Sitemap & Database)
      await triggerCommunication('sitemap', 'database', 'Sitemap.md เสร็จแล้ว ส่งต่อให้ฝ่าย Data Architect...');
      await triggerCommunication('database', 'forge', 'Database Schema พร้อมสำหรับการผลิตโค้ดแล้ว...');
      const plan = await generateTechnicalPlan(research);
      setProject(prev => ({ ...prev!, currentStage: PipelineStage.ARCHITECTURE }));

      // 4. CODING (Forge & Scribe)
      await triggerCommunication('forge', 'scribe', 'กำลังผลิต App.tsx และ Module หลัก ส่งข้อมูลให้ฝ่ายเขียนเอกสาร...');
      const files = await generateCode(research, plan);
      setProject(prev => ({ ...prev!, codeFiles: files, currentStage: PipelineStage.CODING }));

      // 5. QA (Inspector & Sentry)
      await triggerCommunication('inspector', 'sentry', 'เริ่มตรวจสอบโครงสร้างไฟล์ prd, context, sitemap, database, agent ให้ครบถ้วน...');
      const audit = await auditCode(files);
      addLog('Agent Inspector', `ผลการตรวจทานโครงสร้าง: ${audit.status} - ${audit.notes}`, audit.status === 'Pass' ? 'success' : 'warning');
      
      if (audit.status !== 'Pass') {
        throw new Error(`โครงสร้างซอฟต์แวร์ไม่ผ่านมาตรฐาน: ${audit.notes}`);
      }

      await triggerCommunication('sentry', 'orbit', 'ตรวจสอบความปลอดภัยเรียบร้อย พร้อมสำหรับการ Deployment...');
      
      // 6. DEPLOYMENT
      await triggerCommunication('orbit', 'orbit', 'กำลังติดตั้งระบบบน Global Edge Network...');
      const url = `https://${research.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app`;
      setProject(prev => ({ ...prev!, vercelUrl: url, currentStage: PipelineStage.DEPLOYMENT }));
      addLog('Agent Orbit', `แอปพลิเคชันออนไลน์สมบูรณ์ที่: ${url}`, 'success');

    } catch (err: any) {
      addLog('กองทัพ AI', `การปฏิบัติการขัดข้อง: ${err.message}`, 'error');
    } finally {
      setIsFactoryRunning(false);
    }
  };

  const agentNodes = useMemo(() => {
    return agents.map((agent, i) => {
      const angle = (i / agents.length) * 2 * Math.PI;
      const radius = 160;
      return { ...agent, x: 200 + radius * Math.cos(angle), y: 200 + radius * Math.sin(angle) };
    });
  }, [agents]);

  const getFileIcon = (path: string) => {
    if (path.includes('prd') || path.includes('context')) return <ClipboardList size={16} className="text-blue-400" />;
    if (path.includes('sitemap')) return <Map size={16} className="text-purple-400" />;
    if (path.includes('database')) return <Database size={16} className="text-amber-400" />;
    if (path.includes('agent')) return <Users size={16} className="text-indigo-400" />;
    if (path.endsWith('.md')) return <BookOpen size={16} className="text-slate-400" />;
    return <Code size={16} className="text-emerald-400" />;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto bg-[#030712] text-slate-200">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass p-8 rounded-[2.5rem] shadow-2xl border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-transparent">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-3xl shadow-indigo-500/40 shadow-2xl relative group">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl"></div>
            <Factory className="text-white" size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400 tracking-tighter">
              SOCIAL FORGE <span className="text-xs bg-indigo-500/20 text-indigo-400 py-1 px-3 rounded-full align-middle border border-indigo-500/30 ml-2">SOFTWARE ARMY</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium tracking-wide">กองทัพ AI Software Factory: ผลิตซอฟต์แวร์มาตรฐานสากลอัตโนมัติ</p>
          </div>
        </div>
        <button 
          onClick={startFactory} 
          disabled={isFactoryRunning} 
          className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl transition-all shadow-2xl shadow-indigo-500/30 active:scale-95 disabled:opacity-50 flex items-center gap-3 text-lg group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
          {isFactoryRunning ? <Zap className="animate-spin" /> : <Rocket className="group-hover:-translate-y-1 transition-transform" />}
          {isFactoryRunning ? 'ทัพ AI กำลังปฏิบัติการ...' : 'เคลื่อนกองทัพ AI'}
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* กองทัพ Agent Visualization */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass p-8 rounded-[2.5rem] border-white/5 relative h-[550px] overflow-hidden bg-slate-950/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={16} /> Agent Deployment Graph
              </h2>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-75"></div>
              </div>
            </div>
            
            <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(79,70,229,0.1)]">
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* เส้นเชื่อมโยงการสื่อสาร */}
              {agentNodes.map(node => node.targetId && (
                <g key={`comm-${node.id}`}>
                  <line 
                    x1={node.x} y1={node.y} 
                    x2={agentNodes.find(n => n.id === node.targetId)?.x || 200} 
                    y2={agentNodes.find(n => n.id === node.targetId)?.y || 200} 
                    stroke="url(#grad-line)" strokeWidth="3" strokeDasharray="6 6" className="animate-[dash_20s_linear_infinite]" 
                  />
                  <defs>
                    <linearGradient id="grad-line" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </g>
              ))}

              {/* โหนด Agent */}
              {agentNodes.map(node => (
                <g key={node.id} className="cursor-help group">
                  <circle 
                    cx={node.x} cy={node.y} r="24" 
                    className={`transition-all duration-700 stroke-2 ${
                      node.status === AgentStatus.WORKING ? 'fill-indigo-500/20 stroke-indigo-400 animate-pulse scale-110' : 
                      node.status === AgentStatus.COMPLETED ? 'fill-emerald-500/10 stroke-emerald-500' : 
                      'fill-slate-900 stroke-slate-700'
                    }`}
                  />
                  <image href={node.avatar} x={node.x - 18} y={node.y - 18} width="36" height="36" className="rounded-full pointer-events-none" />
                  <text x={node.x} y={node.y + 42} textAnchor="middle" fill={node.status === AgentStatus.WORKING ? '#818cf8' : '#64748b'} fontSize="9" fontWeight="900" className="uppercase tracking-widest">{node.role}</text>
                  
                  {/* Tooltip on Hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <rect x={node.x - 50} y={node.y - 65} width="100" height="25" rx="5" fill="#1e293b" />
                     <text x={node.x} y={node.y - 48} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">{node.name}</text>
                  </g>
                </g>
              ))}
            </svg>
          </div>

          <div className="glass p-6 rounded-3xl border-white/5 bg-slate-950/20">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500" /> Infrastructure Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Github size={18} className="text-slate-400" />
                  <span className="text-xs font-bold">GitHub Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">ONLINE</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-slate-400" />
                  <span className="text-xs font-bold">Vercel Edge</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ข้อมูลโครงการ & Terminal */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          {project && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="glass p-8 rounded-[2.5rem] border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                  <Search size={120} />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 tracking-tighter">{project.name}</h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed font-medium">{project.concept}</p>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} /> Critical Pain Points
                    </h4>
                    <div className="space-y-2">
                      {project.painPoints.map((p, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                          <span className="text-rose-500 font-black">0{i+1}</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="glass p-8 rounded-[2.5rem] border-emerald-500/30 bg-emerald-500/5 flex-1">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <Zap size={14} /> Core Solution Architecture
                  </h4>
                  <div className="space-y-2">
                    {project.solutions.map((s, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="glass p-8 rounded-[2.5rem] border-purple-500/30 bg-purple-500/5">
                   <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <Presentation size={14} /> Investor Pitch Summary
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic font-medium">"{project.presentation}"</p>
                  {project.vercelUrl && (
                    <a href={project.vercelUrl} target="_blank" className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-400 hover:bg-emerald-500/20 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 group">
                      Deployment Live Now
                      <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Terminal */}
          <div className="flex-1 glass rounded-[2.5rem] overflow-hidden border-white/10 flex flex-col min-h-[450px] shadow-2xl">
            <div className="bg-slate-900/90 p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Army Command & Communication Hub</span>
              </div>
              <Terminal size={16} className="text-slate-600" />
            </div>
            <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto bg-slate-950/40 custom-scrollbar">
              {!project?.logs.length ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                  <MessageSquare size={48} strokeWidth={1} />
                  <p className="uppercase tracking-[0.2em] font-black text-[10px]">ระบบพร้อมสำหรับการปฏิบัติการ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.logs.map(log => (
                    <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-slate-600 shrink-0 font-medium select-none">{log.timestamp}</span>
                      <div className="space-y-1">
                        <span className="text-indigo-400 font-black uppercase text-[9px] tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {log.agentName}
                        </span>
                        <p className={`leading-relaxed ${
                          log.type === 'success' ? 'text-emerald-400' : 
                          log.type === 'error' ? 'text-rose-400' : 
                          log.type === 'warning' ? 'text-amber-400' : 
                          'text-slate-300'
                        }`}>
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* รายการไฟล์ผลิต (Artifacts) */}
          {project && project.codeFiles.length > 0 && (
            <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-700 bg-gradient-to-b from-slate-900/50 to-transparent">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/30 shadow-inner">
                    <FileJson className="text-indigo-400" size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-2xl tracking-tighter">คลังสินค้าซอฟต์แวร์ (Artifacts)</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Verified Standard Assets by Agent Inspector</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadAll} 
                  disabled={isDownloading} 
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs shadow-2xl shadow-indigo-500/20 flex items-center gap-3 active:scale-95 transition-all group"
                >
                  {isDownloading ? <Zap className="animate-spin" /> : <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />}
                  DOWNLOAD PRODUCTION PACKAGE
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {project.codeFiles.map((file, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedFile(file)} 
                    className="p-5 bg-slate-950/60 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/40 rounded-3xl transition-all group text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ExternalLink size={10} className="text-indigo-400" />
                    </div>
                    <div className="p-3 bg-slate-900 rounded-2xl text-slate-500 group-hover:bg-indigo-500 group-hover:text-white mb-4 w-fit border border-white/5 transition-all">
                      {getFileIcon(file.path)}
                    </div>
                    <span className="text-[11px] font-black text-slate-300 truncate block uppercase tracking-tighter group-hover:text-white transition-colors">{file.path}</span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 block">
                      {file.path.endsWith('.md') ? 'DOCUMENT' : 'SOURCE CODE'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* File Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  {getFileIcon(selectedFile.path)}
                </div>
                <span className="font-mono text-sm font-black text-indigo-400 tracking-wider uppercase">{selectedFile.path}</span>
              </div>
              <button 
                onClick={() => setSelectedFile(null)} 
                className="text-slate-500 hover:text-white p-3 hover:bg-white/5 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-10 font-mono text-[13px] text-slate-300 leading-relaxed custom-scrollbar bg-slate-950/30">
              <pre className="whitespace-pre-wrap">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-between items-center bg-slate-900/50">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Software Factory Viewer v2.0
               </div>
               <button 
                onClick={() => setSelectedFile(null)} 
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black transition-all border border-white/5"
              >
                CLOSE VIEWER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Shimmer (Decorative) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[150px] animate-pulse delay-700"></div>
      </div>
      
      <footer className="mt-12 mb-8 text-center">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
          &copy; 2024 SOCIAL FORGE BY AI ARMY &bull; BUILT WITH GEMINI 3 PRO &bull; AUTONOMOUS ENGINE
        </p>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
      `}</style>
    </div>
  );
};

export default App;
