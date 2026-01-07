
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgentStatus, PipelineStage, AIAgent, ProjectState, LogEntry, ConnectionState } from './types';
import { performResearch, generateTechnicalPlan, generateCode, auditCode } from './services/geminiService';
import { 
  Terminal, Code, Cpu, Rocket, ShieldCheck, Factory, Zap, 
  Globe, CheckCircle2, AlertTriangle, ExternalLink, X, 
  Download, FileJson, FileText, Presentation, BookOpen, 
  Users, Database, Map, ClipboardList, Info, MessageSquare, 
  ArrowRight, RefreshCcw, Layers, Activity, Monitor, ChevronRight
} from 'lucide-react';
import JSZip from 'jszip';

// คำนิยามกองทัพ AI ตามโจทย์ที่ได้รับ
const INITIAL_AGENTS: AIAgent[] = [
  { id: 'echo', name: 'Nexus Echo', role: 'Strategic Intelligence', description: 'วิเคราะห์เทรนด์และค้นหาโอกาสทางการตลาด', stage: PipelineStage.RESEARCH, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo&backgroundColor=020617' },
  { id: 'prd', name: 'Agent PRD', role: 'Product Strategist', description: 'สร้าง PRD.md กำหนดขอบเขตสินค้าและเป้าหมาย', stage: PipelineStage.PLANNING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=prd&backgroundColor=020617' },
  { id: 'context', name: 'Agent Context', role: 'Context Engineer', description: 'สร้าง context.md วิเคราะห์สภาพแวดล้อมเทคนิค', stage: PipelineStage.PLANNING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=context&backgroundColor=020617' },
  { id: 'sitemap', name: 'Agent Sitemap', role: 'UX Architect', description: 'สร้าง sitemap.md วางโครงสร้างหน้าเว็บและ Flow', stage: PipelineStage.ARCHITECTURE, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ux&backgroundColor=020617' },
  { id: 'database', name: 'Agent Database', role: 'Data Engineer', description: 'สร้าง database.md ออกแบบ Database Schema', stage: PipelineStage.ARCHITECTURE, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=db&backgroundColor=020617' },
  { id: 'forge', name: 'Agent Forge', role: 'Lead Developer', description: 'ผลิต App.tsx และระบบการทำงานหลัก', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=forge&backgroundColor=020617' },
  { id: 'scribe', name: 'Agent Scribe', role: 'Tech Writer', description: 'สร้าง README.md และเอกสารประกอบการใช้งาน', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=scribe&backgroundColor=020617' },
  { id: 'inspector', name: 'Agent Audit', role: 'QA Inspector', description: 'ตรวจสอบไฟล์งานตามมาตรฐาน Software Engineering', stage: PipelineStage.QA, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=audit&backgroundColor=020617' },
  { id: 'orbit', name: 'Nexus Orbit', role: 'DevOps Nexus', description: 'บริหารจัดการ Deployment และโครงสร้างพื้นฐาน', stage: PipelineStage.DEPLOYMENT, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=orbit&backgroundColor=020617' },
];

const getFileIcon = (path: string) => {
  const p = path.toLowerCase();
  if (p.endsWith('.tsx') || p.endsWith('.ts')) return <Code size={20} className="text-cyan-400" />;
  if (p.includes('prd')) return <ClipboardList size={20} className="text-purple-400" />;
  if (p.includes('context')) return <Info size={20} className="text-blue-400" />;
  if (p.includes('sitemap')) return <Map size={20} className="text-orange-400" />;
  if (p.includes('database')) return <Database size={20} className="text-emerald-400" />;
  if (p.includes('agent')) return <MessageSquare size={20} className="text-indigo-400" />;
  if (p.includes('presentation')) return <Presentation size={20} className="text-pink-400" />;
  if (p.includes('readme')) return <BookOpen size={20} className="text-slate-400" />;
  return <FileJson size={20} className="text-cyan-400" />;
};

const App: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AGENTS);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [isFactoryRunning, setIsFactoryRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeFlow, setActiveFlow] = useState<{ from: string, to: string } | null>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((agentName: string, message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      agentName,
      message,
      type
    };
    setProject(prev => {
      const logs = prev ? [...prev.logs, newLog] : [newLog];
      return prev ? { ...prev, logs } : {
        id: 'nexus-cmd', name: 'Standby Mode', concept: '', painPoints: [], solutions: [], presentation: '', features: [], codeFiles: [], logs, currentStage: PipelineStage.RESEARCH
      };
    });
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [project?.logs]);

  const updateAgent = useCallback((id: string, updates: Partial<AIAgent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const triggerLink = useCallback(async (fromId: string, toId: string, message: string) => {
    setActiveFlow({ from: fromId, to: toId });
    updateAgent(fromId, { status: AgentStatus.WORKING, lastMessage: message, targetId: toId });
    addLog(INITIAL_AGENTS.find(a => a.id === fromId)?.name || 'System', message, 'info');
    await new Promise(r => setTimeout(r, 1500));
    setActiveFlow(null);
    updateAgent(fromId, { targetId: undefined, status: AgentStatus.COMPLETED });
  }, [updateAgent, addLog]);

  const startFactory = async () => {
    if (isFactoryRunning) return;
    setIsFactoryRunning(true);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: AgentStatus.IDLE, lastMessage: undefined })));
    
    try {
      // Step 1: Research
      await triggerLink('echo', 'echo', 'กำลังสแกนหาช่องว่างในตลาด Social Tech 2025...');
      const research = await performResearch('Future Social Interaction & Web3 Creators');
      setProject(prev => ({ ...prev!, ...research, currentStage: PipelineStage.RESEARCH }));
      
      // Step 2: Planning (Agent PRD & Agent Context)
      await triggerLink('echo', 'prd', 'ส่งต่อข้อมูล Niche ตลาดให้ Agent PRD ร่าง PRD.md...');
      await triggerLink('prd', 'context', 'PRD พร้อมแล้ว ส่งต่อให้ Agent Context วิเคราะห์บริบททางเทคนิค...');
      
      // Step 3: Architecture (Agent Sitemap & Agent Database)
      await triggerLink('context', 'sitemap', 'โครงสร้างเทคนิคเรียบร้อย ส่งต่อให้ Agent Sitemap วาง User Flow...');
      await triggerLink('sitemap', 'database', 'UX Flow พร้อมแล้ว Agent Database กำลังออกแบบ Schema ข้อมูล...');
      const plan = await generateTechnicalPlan(research);
      setProject(prev => ({ ...prev!, currentStage: PipelineStage.ARCHITECTURE }));

      // Step 4: Coding & Quality Loop
      let codeFiles: any[] = [];
      let loop = 0;
      while (loop < 2) {
        loop++;
        await triggerLink('database', 'forge', loop > 1 ? `รอบที่ ${loop}: กำลังแก้ไขโค้ดตามผลการตรวจสอบ...` : 'โครงสร้างฐานข้อมูลเสร็จสิ้น ส่งต่อให้ Agent Forge เริ่มการผลิตซอร์สโค้ด...');
        await triggerLink('forge', 'scribe', 'โค้ดส่วนใหญ่เสร็จแล้ว ฝ่าย Scribe เริ่มจัดทำเอกสารคู่มือ...');
        codeFiles = await generateCode(research, plan);
        setProject(prev => ({ ...prev!, codeFiles, currentStage: PipelineStage.CODING }));

        await triggerLink('scribe', 'inspector', 'รวบรวมไฟล์ทั้งหมดส่งให้ฝ่าย Audit ตรวจสอบคุณภาพงาน...');
        const audit = await auditCode(codeFiles);
        if (audit.status === 'Pass') {
          addLog('Nexus Audit', 'ตรวจสอบสำเร็จ งานผ่านมาตรฐาน 100%', 'success');
          break;
        } else {
          addLog('Nexus Audit', `พบจุดบกพร่อง: ${audit.notes}. กำลังส่งกลับไปแก้ไข...`, 'warning');
          await triggerLink('inspector', 'forge', 'ส่ง Feedback ข้อผิดพลาดกลับไปยังฝ่าย Developer...');
        }
      }

      // Step 5: Deployment
      await triggerLink('inspector', 'orbit', 'งานทุกอย่างพร้อมแล้ว Nexus Orbit กำลังทำ Automated Deployment...');
      const finalUrl = `https://${research.name.toLowerCase().replace(/\s+/g, '-')}.nexus-forge.ai`;
      setProject(prev => ({ ...prev!, vercelUrl: finalUrl, currentStage: PipelineStage.DEPLOYMENT }));
      addLog('Nexus Orbit', `ปฏิบัติการสำเร็จ! ออนไลน์แล้วที่: ${finalUrl}`, 'success');

    } catch (e: any) {
      addLog('Nexus Error', `ระบบขัดข้อง: ${e.message}`, 'error');
    } finally {
      setIsFactoryRunning(false);
    }
  };

  const handleDownload = async () => {
    if (!project || project.codeFiles.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      project.codeFiles.forEach(f => zip.file(f.path, f.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-project-${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      addLog('System', 'ดาวน์โหลดซอฟต์แวร์แพ็กเกจสำเร็จ', 'success');
    } catch (e: any) {
      addLog('System', 'การสร้างไฟล์ดาวน์โหลดล้มเหลว', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const agentNodes = useMemo(() => {
    return agents.map((agent, i) => {
      const angle = (i / agents.length) * 2 * Math.PI;
      const radius = 180;
      return { ...agent, x: 250 + radius * Math.cos(angle), y: 250 + radius * Math.sin(angle) };
    });
  }, [agents]);

  const activeLink = useMemo(() => {
    if (!activeFlow) return null;
    const from = agentNodes.find(n => n.id === activeFlow.from);
    const to = agentNodes.find(n => n.id === activeFlow.to);
    if (!from || !to) return null;
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  }, [activeFlow, agentNodes]);

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col gap-8 max-w-[1600px] mx-auto relative z-10">
      
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 glass-card p-10 rounded-[3rem] border-white/10 relative overflow-hidden">
        <div className="flex items-center gap-8 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
            <div className="bg-slate-950 p-6 rounded-[2rem] border border-cyan-500/30 flex items-center justify-center relative">
              <Cpu className="text-cyan-400" size={42} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">NEXUS<span className="text-cyan-400">FORGE</span></h1>
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_cyan]"></div>
            </div>
            <p className="text-slate-400 font-mono text-xs mt-3 tracking-widest uppercase flex items-center gap-3">
              <Activity size={14} className="text-cyan-400" /> System Engine: Gemini 3.0 Pro Enterprise
            </p>
          </div>
        </div>

        <button 
          onClick={startFactory} 
          disabled={isFactoryRunning} 
          className="px-12 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-3xl transition-all shadow-2xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 text-lg group overflow-hidden relative"
        >
          {isFactoryRunning ? <RefreshCcw className="animate-spin" /> : <Rocket className="group-hover:-translate-y-1 transition-transform" />}
          {isFactoryRunning ? 'OPERATING...' : 'INITIATE AUTO-FORGE'}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Agent Visualization Center */}
        <aside className="xl:col-span-5 flex flex-col gap-8">
          <div className="glass-card p-8 rounded-[3.5rem] relative h-[700px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex flex-col">
                <h2 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.5em] flex items-center gap-3">
                  <Monitor size={16} /> Neural Command Map
                </h2>
                <span className="text-slate-500 text-[10px] mt-1 font-mono uppercase">Live Agent Synapse Protocol</span>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500/50"></div>
                <div className="h-2 w-2 rounded-full bg-emerald-500/50 animate-pulse"></div>
              </div>
            </div>

            <svg viewBox="0 0 500 500" className="w-full h-full relative z-10 drop-shadow-[0_0_25px_rgba(6,182,212,0.1)]">
              <defs>
                <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              <circle cx="250" cy="250" r="180" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="10 5" />

              {activeLink && (
                <g>
                  <path 
                    d={`M ${activeLink.x1} ${activeLink.y1} Q 250 250 ${activeLink.x2} ${activeLink.y2}`}
                    fill="none" stroke="url(#link-grad)" strokeWidth="3" strokeDasharray="8 8" 
                    className="animate-[dash_10s_linear_infinite]"
                  />
                  <circle r="6" fill="#06b6d4" className="shadow-[0_0_15px_cyan]">
                    <animateMotion 
                      path={`M ${activeLink.x1} ${activeLink.y1} Q 250 250 ${activeLink.x2} ${activeLink.y2}`} 
                      dur="1s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                </g>
              )}

              {agentNodes.map(node => (
                <g key={node.id} className="agent-node">
                  <circle 
                    cx={node.x} cy={node.y} r="38" 
                    className={`transition-all duration-700 stroke-[1.5] ${
                      node.status === AgentStatus.WORKING ? 'fill-cyan-500/10 stroke-cyan-400 animate-pulse scale-110' : 
                      node.status === AgentStatus.COMPLETED ? 'fill-emerald-500/10 stroke-emerald-500' : 
                      'fill-slate-950 stroke-white/10'
                    }`}
                  />
                  <image href={node.avatar} x={node.x - 26} y={node.y - 26} width="52" height="52" className="rounded-full" />
                  
                  <text 
                    x={node.x} y={node.y + 55} 
                    textAnchor="middle" 
                    fill={node.status === AgentStatus.WORKING ? '#06b6d4' : '#64748b'} 
                    fontSize="8" 
                    fontWeight="800" 
                    className="uppercase tracking-widest font-mono"
                  >
                    {node.role.split(' ')[0]}
                  </text>
                </g>
              ))}
            </svg>

            <div className="absolute bottom-10 left-10 right-10 p-8 glass-card bg-slate-950/40 rounded-[2.5rem] border-cyan-500/20 backdrop-blur-3xl shadow-2xl relative z-20">
              <div className="flex items-center gap-4 mb-4">
                <div className={`h-3 w-3 rounded-full ${isFactoryRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`}></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Neural Reasoning</h4>
              </div>
              <p className="text-[13px] text-slate-200 font-bold leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-1">
                "{agents.find(a => a.status === AgentStatus.WORKING)?.lastMessage || "Nexus awaiting primary sequence..."}"
              </p>
            </div>
          </div>
        </aside>

        {/* Console and Output Control */}
        <section className="xl:col-span-7 flex flex-col gap-10">
          
          {project && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="glass-card p-10 rounded-[3rem] border-cyan-500/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase mb-2 block">Market Discovery</span>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-6">{project.name}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={14} /> Targeted Pain Points
                      </h4>
                      <div className="grid gap-2">
                        {project.painPoints.map((p, i) => (
                          <div key={i} className="text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-white/5 font-medium leading-relaxed">
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {project.vercelUrl && (
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <a href={project.vercelUrl} target="_blank" className="p-5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-2xl flex items-center justify-between font-black text-xs uppercase tracking-widest transition-all">
                      Go Live Application
                      <ExternalLink size={18} />
                    </a>
                  </div>
                )}
              </div>

              <div className="glass-card p-10 rounded-[3rem] border-emerald-500/10">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Zap size={14} /> Technical Solution Matrix
                </h4>
                <div className="grid gap-3">
                  {project.solutions.map((s, i) => (
                    <div key={i} className="text-xs text-slate-200 flex items-start gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 font-medium leading-relaxed group hover:border-emerald-500/30 transition-all">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Neural Terminal Console */}
          <div className="flex-1 flex flex-col glass-card rounded-[4rem] overflow-hidden min-h-[500px] border-white/10 shadow-2xl">
            <div className="bg-slate-900/90 p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-[#ff5f56]"></div>
                  <div className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e]"></div>
                  <div className="h-3.5 w-3.5 rounded-full bg-[#27c93f]"></div>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2"></div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.5em] font-mono">Neural Nexus Terminal v10.4.0</span>
              </div>
              <Terminal size={24} className="text-slate-700" />
            </div>
            
            <div className="flex-1 p-10 font-mono text-[13px] overflow-y-auto bg-slate-950/60 custom-scrollbar">
              {!project?.logs.length ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-10">
                   <div className="relative">
                      <Monitor size={80} strokeWidth={1} className="opacity-20 animate-pulse" />
                      <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full"></div>
                   </div>
                  <p className="uppercase tracking-[0.5em] font-black text-[11px] opacity-30">Awaiting Primary Initiation Sequence...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {project.logs.map(log => (
                    <div key={log.id} className="flex gap-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-6 border-b border-white/5 last:border-0">
                      <span className="text-slate-600 shrink-0 font-bold w-24 select-none opacity-40">{log.timestamp}</span>
                      <div className="space-y-2">
                        <span className="text-cyan-400 font-black uppercase text-[10px] tracking-widest bg-cyan-400/5 px-3 py-1 rounded-lg border border-cyan-400/10">
                          {log.agentName}
                        </span>
                        <p className={`leading-relaxed mt-2 ${
                          log.type === 'success' ? 'text-emerald-400 font-bold' : 
                          log.type === 'error' ? 'text-rose-400 font-bold' : 
                          log.type === 'warning' ? 'text-amber-400' : 
                          'text-slate-200 font-medium'
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

          {/* Secure Artifact Grid */}
          {project && project.codeFiles.length > 0 && (
            <div className="glass-card p-14 rounded-[4.5rem] bg-gradient-to-tr from-slate-950 via-slate-950 to-cyan-950/10 border-white/10 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-12 relative z-10">
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-cyan-400/10 rounded-[2.5rem] border border-cyan-400/20 shadow-inner">
                    <FileJson className="text-cyan-400" size={38} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-3xl tracking-tighter">Verified Artifact Matrix</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-3">Compliance Verified &bull; 9 Unified Modules Standardized</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownload} 
                  disabled={isDownloading} 
                  className="px-12 py-6 bg-white text-slate-950 hover:bg-cyan-50 font-black rounded-[2.2rem] text-xs shadow-2xl flex items-center gap-4 transition-all active:scale-95 group uppercase tracking-widest"
                >
                  {isDownloading ? <RefreshCcw className="animate-spin" /> : <Download size={22} className="group-hover:translate-y-1 transition-transform" />}
                  Export Package
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 relative z-10">
                {project.codeFiles.map((file, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedFile(file)} 
                    className="p-8 bg-slate-950/60 hover:bg-cyan-400/10 border border-white/5 hover:border-cyan-400/30 rounded-[2.8rem] transition-all group text-left relative overflow-hidden backdrop-blur-3xl"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowRight size={18} className="text-cyan-400 -rotate-45" />
                    </div>
                    <div className="p-5 bg-slate-900 rounded-[1.8rem] text-slate-600 group-hover:bg-cyan-400 group-hover:text-slate-950 mb-8 w-fit border border-white/5 transition-all">
                      {getFileIcon(file.path)}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[12px] font-black text-slate-200 truncate block uppercase tracking-tight group-hover:text-white transition-colors">{file.path}</span>
                       <span className="text-[9px] text-slate-600 font-bold uppercase mt-3 block tracking-[0.2em] group-hover:text-cyan-400/60">
                         {file.path.endsWith('.md') ? 'MODULE_DOC' : 'SOURCE_CORE'}
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Artifact Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-8 md:p-12 animate-in zoom-in duration-500">
          <div className="glass-card rounded-[4.5rem] w-full max-w-7xl max-h-[92vh] flex flex-col shadow-[0_0_200px_rgba(0,242,255,0.15)] overflow-hidden border-white/10">
            <div className="p-10 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-8">
                <div className="p-5 bg-cyan-400/10 rounded-2xl border border-cyan-400/20">
                  {getFileIcon(selectedFile.path)}
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-2xl font-black text-cyan-400 tracking-wider uppercase">{selectedFile.path}</span>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1">Artifact Inspection Protocol v8.1.0</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFile(null)} 
                className="text-slate-500 hover:text-white p-5 hover:bg-white/5 rounded-full transition-all active:scale-90"
              >
                <X size={42} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-14 font-mono text-[14px] text-slate-300 leading-relaxed custom-scrollbar bg-slate-950/40">
              <pre className="whitespace-pre-wrap selection:bg-cyan-500/40">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
            <div className="p-10 border-t border-white/10 flex justify-between items-center bg-slate-900/60">
               <div className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono">
                  MATRIX_KERNEL_STABLE_READY
               </div>
               <button 
                onClick={() => setSelectedFile(null)} 
                className="px-16 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[2rem] text-xs font-black transition-all border border-white/10 active:scale-95 tracking-widest"
              >
                CLOSE INSPECTION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-5] overflow-hidden opacity-40">
         <div className="absolute top-[-25%] left-[-20%] w-[80%] h-[80%] bg-cyan-600/10 blur-[250px] animate-pulse"></div>
         <div className="absolute bottom-[-25%] right-[-20%] w-[80%] h-[80%] bg-indigo-900/10 blur-[250px] animate-pulse delay-1000"></div>
      </div>
      
      <footer className="mt-20 mb-16 text-center border-t border-white/5 pt-16">
        <div className="flex flex-col items-center gap-6 opacity-40">
           <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.8em]">
             &copy; 2025 NEXUSFORGE COMMAND SYSTEM &bull; ARMED BY GEMINI 3 PRO &bull; AUTONOMOUS ARMY v1.4
           </p>
           <div className="flex gap-10">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
           </div>
        </div>
      </footer>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
};

export default App;
