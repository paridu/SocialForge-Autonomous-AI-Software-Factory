
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgentStatus, PipelineStage, AIAgent, ProjectState, LogEntry } from './types';
import { performResearch, generateTechnicalPlan, generateCode, auditCode } from './services/geminiService';
import { 
  Terminal, Code, Cpu, Rocket, ShieldCheck, Factory, Zap, 
  Globe, CheckCircle2, AlertTriangle, ExternalLink, X, 
  Download, FileJson, FileText, Presentation, BookOpen, 
  Users, Database, Map, ClipboardList, Info, MessageSquare, 
  ArrowRight, RefreshCcw, Layers, Activity, Monitor, Search
} from 'lucide-react';
import JSZip from 'jszip';

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
        id: 'nexus-cmd', name: 'Ready for Protocol', concept: '', painPoints: [], solutions: [], presentation: '', features: [], codeFiles: [], logs, currentStage: PipelineStage.RESEARCH
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
      await triggerLink('echo', 'echo', 'Initializing deep-market intelligence scan for 2025 opportunities...');
      const research = await performResearch('AI-First Decentralized Social Platforms');
      setProject(prev => ({ ...prev!, ...research, currentStage: PipelineStage.RESEARCH }));
      
      // Step 2: Planning
      await triggerLink('echo', 'prd', 'Market intelligence secured. Dispatching data to Product Strategist...');
      await triggerLink('prd', 'context', 'PRD blueprint finalized. Context Engineer initiating system environment mapping...');
      
      // Step 3: Architecture
      await triggerLink('context', 'sitemap', 'Technical constraints analyzed. UX Architect building interaction flows...');
      await triggerLink('sitemap', 'database', 'User journey mapped. Data Engineer designing relational schema...');
      const plan = await generateTechnicalPlan(research);
      setProject(prev => ({ ...prev!, currentStage: PipelineStage.ARCHITECTURE }));

      // Step 4: Coding & Quality Loop
      let codeFiles: any[] = [];
      let loop = 0;
      const maxLoops = 2;

      while (loop < maxLoops) {
        loop++;
        await triggerLink('database', 'forge', loop > 1 ? `Revision Cycle ${loop}: Rectifying structural inconsistencies...` : 'Schema confirmed. Lead Developer initiating core module fabrication...');
        await triggerLink('forge', 'scribe', 'Modules reaching alpha status. Technical Writer documenting system architecture...');
        codeFiles = await generateCode(research, plan);
        setProject(prev => ({ ...prev!, codeFiles, currentStage: PipelineStage.CODING }));

        await triggerLink('scribe', 'inspector', 'Bundling code matrix for structural integrity audit...');
        const audit = await auditCode(codeFiles);
        if (audit.status === 'Pass') {
          addLog('Nexus Audit', 'Integrity check successful. Software meets all enterprise standards.', 'success');
          break;
        } else {
          addLog('Nexus Audit', `Inconsistency detected: ${audit.notes}. Re-routing for correction...`, 'warning');
          await triggerLink('inspector', 'forge', 'Dispatching feedback loop to development core...');
        }
      }

      // Step 5: Deployment
      await triggerLink('inspector', 'orbit', 'Quality protocol complete. Nexus Orbit initializing automated deployment...');
      const finalUrl = `https://${research.name.toLowerCase().replace(/\s+/g, '-')}.nexus-forge.ai`;
      setProject(prev => ({ ...prev!, vercelUrl: finalUrl, currentStage: PipelineStage.DEPLOYMENT }));
      addLog('Nexus Orbit', `Operational Success. Platform deployed to production grid at: ${finalUrl}`, 'success');

    } catch (e: any) {
      addLog('Nexus Critical', `Kernel Failure: ${e.message}`, 'error');
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
      a.download = `nexus-artifact-${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      addLog('System', 'Artifact package secured and exported.', 'success');
    } catch (e: any) {
      addLog('System', 'Export encryption failed.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const agentNodes = useMemo(() => {
    return agents.map((agent, i) => {
      const angle = (i / agents.length) * 2 * Math.PI;
      const radius = 190;
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
    <div className="min-h-screen p-6 md:p-10 flex flex-col gap-10 max-w-[1700px] mx-auto relative z-10">
      
      {/* Nexus Command Center Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 glass-card p-10 md:p-14 rounded-[3.5rem] cyber-border overflow-hidden relative group">
        <div className="flex items-center gap-10 relative z-10">
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-25 animate-pulse"></div>
            <div className="bg-slate-950 p-7 rounded-[2.5rem] border border-cyan-500/40 flex items-center justify-center relative shadow-2xl">
              <Cpu className="text-cyan-400 group-hover:rotate-90 transition-transform duration-1000" size={52} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-5">
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">NEXUS<span className="text-cyan-400">FORGE</span></h1>
              <div className="px-4 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase">Enterprise v4.0</div>
            </div>
            <p className="text-slate-400 font-mono text-xs mt-4 tracking-[0.2em] uppercase flex items-center gap-4">
              <Activity size={16} className="text-cyan-500 animate-pulse" /> Autonomous Army Neural Grid Operational
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 w-full xl:w-auto">
          <button 
            onClick={startFactory} 
            disabled={isFactoryRunning} 
            className="w-full xl:w-auto px-16 py-7 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-[2.2rem] transition-all shadow-[0_20px_60px_rgba(6,182,212,0.25)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-5 text-xl group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            {isFactoryRunning ? <RefreshCcw className="animate-spin" size={24} /> : <Rocket size={24} className="group-hover:-translate-y-1 transition-transform" />}
            {isFactoryRunning ? 'OPERATING GRID...' : 'INITIATE AUTO-FORGE'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-10 flex-1">
        
        {/* Agent Visualization Hub */}
        <aside className="2xl:col-span-5 flex flex-col gap-10">
          <div className="glass-card p-10 rounded-[4rem] relative h-[750px] overflow-hidden flex flex-col shadow-inner group">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex flex-col">
                <h2 className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.6em] flex items-center gap-4">
                  <Monitor size={18} /> Neural Synapse Map
                </h2>
                <span className="text-slate-500 text-[10px] mt-2 font-mono uppercase tracking-widest">Real-time Agent Communication Matrix</span>
              </div>
              <div className="flex gap-3">
                <div className="h-3 w-3 rounded-full bg-cyan-500/20 border border-cyan-500/40"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500/40 animate-pulse border border-emerald-500/60"></div>
              </div>
            </div>

            <svg viewBox="0 0 500 500" className="w-full h-full relative z-10 filter drop-shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <defs>
                <linearGradient id="synapse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
                <filter id="glow-synapse">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <circle cx="250" cy="250" r="190" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="15 10" />

              {activeLink && (
                <g filter="url(#glow-synapse)">
                  <path 
                    d={`M ${activeLink.x1} ${activeLink.y1} Q 250 250 ${activeLink.x2} ${activeLink.y2}`}
                    fill="none" stroke="url(#synapse-grad)" strokeWidth="4" strokeDasharray="10 10" 
                    className="animate-[dash_8s_linear_infinite]"
                  />
                  <circle r="7" fill="#06b6d4">
                    <animateMotion 
                      path={`M ${activeLink.x1} ${activeLink.y1} Q 250 250 ${activeLink.x2} ${activeLink.y2}`} 
                      dur="0.8s" 
                      repeatCount="indefinite" 
                    />
                  </circle>
                </g>
              )}

              {agentNodes.map(node => (
                <g key={node.id} className="agent-node group/node">
                  <circle 
                    cx={node.x} cy={node.y} r="42" 
                    className={`transition-all duration-700 stroke-[2] ${
                      node.status === AgentStatus.WORKING ? 'fill-cyan-500/10 stroke-cyan-400 animate-pulse scale-110 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 
                      node.status === AgentStatus.COMPLETED ? 'fill-emerald-500/10 stroke-emerald-500' : 
                      'fill-slate-950 stroke-white/10 group-hover/node:stroke-white/30'
                    }`}
                  />
                  <image href={node.avatar} x={node.x - 28} y={node.y - 28} width="56" height="56" className="rounded-full" />
                  
                  <text 
                    x={node.x} y={node.y + 65} 
                    textAnchor="middle" 
                    fill={node.status === AgentStatus.WORKING ? '#06b6d4' : '#64748b'} 
                    fontSize="9" 
                    fontWeight="900" 
                    className="uppercase tracking-[0.2em] font-mono"
                  >
                    {node.role.split(' ')[0]}
                  </text>
                </g>
              ))}
            </svg>

            <div className="absolute bottom-12 left-12 right-12 p-10 glass-card bg-slate-950/60 rounded-[3rem] border-cyan-500/20 backdrop-blur-3xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative z-20">
              <div className="flex items-center gap-5 mb-5">
                <div className={`h-4 w-4 rounded-full ${isFactoryRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`}></div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Grid Processing Unit</h4>
              </div>
              <p className="text-[15px] text-slate-100 font-bold leading-relaxed italic border-l-4 border-cyan-500 pl-6 py-2 bg-white/5 rounded-r-2xl">
                {agents.find(a => a.status === AgentStatus.WORKING)?.lastMessage || "Nexus awaiting primary sequence initiation..."}
              </p>
            </div>
          </div>
        </aside>

        {/* Console and Artifact Delivery Output */}
        <section className="2xl:col-span-7 flex flex-col gap-10">
          
          {project && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="glass-card p-12 rounded-[4rem] border-cyan-500/10 flex flex-col justify-between group">
                <div className="relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                    <Rocket size={300} />
                  </div>
                  <span className="text-[11px] text-cyan-400 font-black tracking-[0.5em] uppercase mb-4 block">Market Insight Detected</span>
                  <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-10">{project.name}</h2>
                  
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[11px] font-black text-rose-500/80 uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                        <AlertTriangle size={18} /> Decrypted Pain Points
                      </h4>
                      <div className="grid gap-4">
                        {project.painPoints.map((p, i) => (
                          <div key={i} className="text-sm text-slate-300 bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 font-semibold leading-relaxed hover:border-rose-500/20 transition-all">
                            <span className="text-rose-500 font-black mr-4 font-mono">0{i+1}</span> {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {project.vercelUrl && (
                  <div className="mt-12 pt-10 border-t border-white/5">
                    <a href={project.vercelUrl} target="_blank" className="p-7 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-[2rem] flex items-center justify-between font-black text-sm uppercase tracking-[0.3em] transition-all shadow-xl group">
                      Initialize Live Deployment
                      <ExternalLink size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                )}
              </div>

              <div className="glass-card p-12 rounded-[4rem] border-emerald-500/10 flex flex-col">
                <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-8 flex items-center gap-4">
                  <Zap size={18} /> Neural Solution Architecture
                </h4>
                <div className="grid gap-4 flex-1">
                  {project.solutions.map((s, i) => (
                    <div key={i} className="text-sm text-slate-100 flex items-start gap-6 bg-slate-900/40 p-7 rounded-[2.5rem] border border-white/5 font-semibold leading-relaxed group hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all shadow-lg">
                      <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 mt-1">
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                      </div>
                      <span className="mt-1">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Secure Neural Terminal */}
          <div className="flex-1 flex flex-col glass-card rounded-[4.5rem] overflow-hidden min-h-[550px] border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            <div className="bg-slate-900/90 p-10 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex gap-3">
                  <div className="h-4 w-4 rounded-full bg-[#ff5f56] shadow-[0_0_15px_#ff5f5680]"></div>
                  <div className="h-4 w-4 rounded-full bg-[#ffbd2e] shadow-[0_0_15px_#ffbd2e80]"></div>
                  <div className="h-4 w-4 rounded-full bg-[#27c93f] shadow-[0_0_15px_#27c93f80]"></div>
                </div>
                <div className="h-10 w-px bg-white/10 mx-3"></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] font-mono">Neural Interface Matrix v11.0.4</span>
                  <span className="text-[9px] text-cyan-500/60 font-mono tracking-widest mt-1">SECURE_TUNNEL: ENCRYPTED_AES256</span>
                </div>
              </div>
              <Terminal size={28} className="text-slate-700 animate-pulse" />
            </div>
            
            <div className="flex-1 p-12 font-mono text-[14px] overflow-y-auto bg-slate-950/60 custom-scrollbar">
              {!project?.logs.length ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-12">
                   <div className="relative">
                      <Monitor size={120} strokeWidth={1} className="opacity-10 animate-pulse" />
                      <div className="absolute inset-0 bg-cyan-500/5 blur-[80px] rounded-full"></div>
                   </div>
                  <p className="uppercase tracking-[0.8em] font-black text-[13px] opacity-20">Awaiting Neural Link Initiation...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {project.logs.map(log => (
                    <div key={log.id} className="flex gap-10 animate-in fade-in slide-in-from-left-6 duration-700 pb-10 border-b border-white/5 last:border-0 relative">
                      <span className="text-slate-600 shrink-0 font-bold w-28 select-none opacity-40 text-xs">{log.timestamp}</span>
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-cyan-400 font-black uppercase text-[11px] tracking-[0.4em] bg-cyan-400/5 px-5 py-2 rounded-2xl border border-cyan-400/10 shadow-lg`}>
                            {log.agentName}
                          </span>
                          <Activity size={12} className="text-slate-800" />
                        </div>
                        <p className={`leading-relaxed mt-4 pl-6 border-l-2 border-white/5 ${
                          log.type === 'success' ? 'text-emerald-400 font-bold' : 
                          log.type === 'error' ? 'text-rose-400 font-bold' : 
                          log.type === 'warning' ? 'text-amber-400' : 
                          'text-slate-200 font-semibold'
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

          {/* Secure Artifact Storage Grid */}
          {project && project.codeFiles.length > 0 && (
            <div className="glass-card p-16 rounded-[5rem] bg-gradient-to-tr from-slate-950 via-slate-950 to-cyan-950/20 border-white/10 relative overflow-hidden shadow-[0_50px_120px_rgba(0,0,0,0.7)]">
              <div className="absolute -right-20 -bottom-20 opacity-[0.02]">
                <Database size={400} />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-12 mb-16 relative z-10">
                <div className="flex items-center gap-10">
                  <div className="p-8 bg-cyan-400/10 rounded-[3rem] border border-cyan-400/20 shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
                    <FileJson className="text-cyan-400" size={52} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-5xl tracking-tighter">Unified Artifact Matrix</h3>
                    <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.6em] mt-4">Integrity Verified &bull; 9 Production Objects Sanitized</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownload} 
                  disabled={isDownloading} 
                  className="px-16 py-8 bg-white text-slate-950 hover:bg-cyan-50 font-black rounded-[2.5rem] text-sm shadow-2xl flex items-center gap-5 transition-all active:scale-95 group uppercase tracking-[0.3em]"
                >
                  {isDownloading ? <RefreshCcw className="animate-spin" /> : <Download size={28} className="group-hover:translate-y-1 transition-transform" />}
                  Secure Export
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-7 relative z-10">
                {project.codeFiles.map((file, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedFile(file)} 
                    className="p-10 bg-slate-950/70 hover:bg-cyan-400/10 border border-white/5 hover:border-cyan-400/40 rounded-[3.5rem] transition-all group text-left relative overflow-hidden backdrop-blur-3xl shadow-xl hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ArrowRight size={22} className="text-cyan-400 -rotate-45" />
                    </div>
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-slate-600 group-hover:bg-cyan-400 group-hover:text-slate-950 mb-10 w-fit border border-white/5 transition-all shadow-inner">
                      {getFileIcon(file.path)}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[14px] font-black text-slate-100 truncate block uppercase tracking-tight group-hover:text-white transition-colors">{file.path}</span>
                       <span className="text-[10px] text-slate-600 font-bold uppercase mt-4 block tracking-[0.3em] group-hover:text-cyan-400/80">
                         {file.path.endsWith('.md') ? 'MODULE_DOC' : 'CORE_SRC'}
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Code Inspector Modal Viewer */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-6 md:p-14 animate-in zoom-in duration-500">
          <div className="glass-card rounded-[5rem] w-full max-w-7xl max-h-[92vh] flex flex-col shadow-[0_0_250px_rgba(6,182,212,0.2)] overflow-hidden border-white/10 cyber-border">
            <div className="p-12 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-10">
                <div className="p-6 bg-cyan-400/10 rounded-3xl border border-cyan-400/20">
                  {getFileIcon(selectedFile.path)}
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider uppercase">{selectedFile.path}</span>
                  <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.6em] mt-2">Nexus Structural Integrity Protocol v9.4.0</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFile(null)} 
                className="text-slate-500 hover:text-white p-6 hover:bg-white/10 rounded-full transition-all active:scale-90"
              >
                <X size={48} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-16 font-mono text-[15px] text-slate-300 leading-relaxed custom-scrollbar bg-slate-950/40">
              <pre className="whitespace-pre-wrap selection:bg-cyan-500/50">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
            <div className="p-12 border-t border-white/10 flex justify-between items-center bg-slate-900/60">
               <div className="text-[12px] font-black text-slate-600 uppercase tracking-[0.8em] font-mono">
                  MATRIX_KERNEL_STABLE_4.0
               </div>
               <button 
                onClick={() => setSelectedFile(null)} 
                className="px-20 py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-[2.5rem] text-sm font-black transition-all border border-white/10 active:scale-95 tracking-[0.4em] shadow-2xl"
              >
                CLOSE INSPECTION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Ambience Layer */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-5] overflow-hidden opacity-50">
         <div className="absolute top-[-30%] left-[-25%] w-[90%] h-[90%] bg-cyan-600/10 blur-[300px] animate-pulse"></div>
         <div className="absolute bottom-[-30%] right-[-25%] w-[90%] h-[90%] bg-indigo-900/10 blur-[300px] animate-pulse delay-1000"></div>
         <div className="absolute top-[20%] right-[5%] w-[50%] h-[50%] bg-purple-600/5 blur-[250px]"></div>
      </div>
      
      <footer className="mt-28 mb-20 text-center border-t border-white/5 pt-24">
        <div className="flex flex-col items-center gap-10 opacity-30 group cursor-default">
           <p className="text-[13px] font-black text-slate-500 uppercase tracking-[1em] group-hover:text-cyan-500 transition-colors">
             &copy; 2025 NEXUSFORGE COMMAND MATRIX &bull; POWERED BY GEMINI 3.0 PRO &bull; AUTONOMOUS RECURSIVE ENGINE
           </p>
           <div className="flex gap-14 items-center">
              <div className="h-px w-40 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <Activity size={20} className="text-white/20 animate-spin-slow" />
              <div className="h-px w-40 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
           </div>
        </div>
      </footer>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.12);
        }
      `}</style>
    </div>
  );
};

export default App;
