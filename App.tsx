
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgentStatus, PipelineStage, AIAgent, ProjectState, LogEntry } from './types';
import { performResearch, generateTechnicalPlan, generateCode, auditCode } from './services/geminiService';
import { 
  Terminal, Code, Cpu, Rocket, ShieldCheck, Factory, Zap, 
  Globe, CheckCircle2, AlertTriangle, ExternalLink, X, 
  Download, FileJson, FileText, Presentation, BookOpen, 
  Users, Database, Map, ClipboardList, Info, MessageSquare, 
  ArrowRight, RefreshCcw, Layers, Activity, Monitor, Search, Sparkles,
  ChevronRight, Layout, CpuIcon
} from 'lucide-react';
import JSZip from 'jszip';

const INITIAL_AGENTS: AIAgent[] = [
  { id: 'echo', name: 'Nexus Echo', role: 'Market Intelligence', description: 'วิเคราะห์เทรนด์และค้นหาโอกาสทางการตลาด', stage: PipelineStage.RESEARCH, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo&backgroundColor=020617' },
  { id: 'agent_prd', name: 'Agent PRD', role: 'Requirement Architect', description: 'ผลิตไฟล์ prd.md กำหนดขอบเขตเชิงลึก', stage: PipelineStage.PLANNING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=prd&backgroundColor=020617' },
  { id: 'agent_context', name: 'Agent Context', role: 'Context Engineer', description: 'ผลิตไฟล์ context.md วิเคราะห์ข้อจำกัดทางเทคนิค', stage: PipelineStage.PLANNING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=context&backgroundColor=020617' },
  { id: 'agent_sitemap', name: 'Agent Sitemap', role: 'UX Navigator', description: 'ผลิตไฟล์ sitemap.md วางโครงสร้าง User Journey', stage: PipelineStage.ARCHITECTURE, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ux&backgroundColor=020617' },
  { id: 'agent_db', name: 'Agent Database', role: 'Data Structurer', description: 'ผลิตไฟล์ database.md ออกแบบ Schema ข้อมูล', stage: PipelineStage.ARCHITECTURE, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=db&backgroundColor=020617' },
  { id: 'agent_ui', name: 'Agent UI-Forge', role: 'Frontend Engineer', description: 'ผลิตไฟล์ App.tsx สร้างหน้าตาและปฏิสัมพันธ์', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ui&backgroundColor=020617' },
  { id: 'agent_entry', name: 'Agent Entry-Forge', role: 'System Integrator', description: 'ผลิตไฟล์ index.tsx เชื่อมต่อระบบหลัก', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=entry&backgroundColor=020617' },
  { id: 'agent_readme', name: 'Agent Readme', role: 'Documentation Specialist', description: 'ผลิตไฟล์ README.md สรุปการใช้งานระบบ', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=readme&backgroundColor=020617' },
  { id: 'agent_history', name: 'Agent Scribe', role: 'Intelligence Historian', description: 'ผลิตไฟล์ agent.md บันทึกตรรกะการตัดสินใจของทีม', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=scribe&backgroundColor=020617' },
  { id: 'agent_pitch', name: 'Agent Pitch-Deck', role: 'Presentation Master', description: 'ผลิตไฟล์ presentation.md สำหรับ Pitching', stage: PipelineStage.CODING, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pitch&backgroundColor=020617' },
  { id: 'auditor', name: 'Nexus Auditor', role: 'Quality Assurance', description: 'ตรวจสอบความถูกต้องและมาตรฐานของไฟล์งานทั้งหมด', stage: PipelineStage.QA, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=audit&backgroundColor=020617' },
  { id: 'orbit', name: 'Nexus Orbit', role: 'DevOps Orchestrator', description: 'บริหารจัดการการปล่อยซอฟต์แวร์สู่สายตาชาวโลก', stage: PipelineStage.DEPLOYMENT, status: AgentStatus.IDLE, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=orbit&backgroundColor=020617' },
];

const STAGES = [
  { key: PipelineStage.RESEARCH, label: 'Research', icon: Globe },
  { key: PipelineStage.PLANNING, label: 'Planning', icon: ClipboardList },
  { key: PipelineStage.ARCHITECTURE, label: 'Arch', icon: Layers },
  { key: PipelineStage.CODING, label: 'Coding', icon: Code },
  { key: PipelineStage.QA, label: 'Audit', icon: ShieldCheck },
  { key: PipelineStage.DEPLOYMENT, label: 'Orbit', icon: Rocket },
];

const getFileIcon = (path: string) => {
  const p = path.toLowerCase();
  if (p.endsWith('.tsx') || p.endsWith('.ts')) return <Code size={20} className="text-cyan-400" />;
  if (p.includes('prd')) return <ClipboardList size={20} className="text-purple-400" />;
  if (p.includes('context')) return <Info size={20} className="text-blue-400" />;
  if (p.includes('sitemap')) return <Map size={20} className="text-orange-400" />;
  if (p.includes('database')) return <Database size={20} className="text-emerald-400" />;
  if (p.includes('agent')) return <Sparkles size={20} className="text-indigo-400" />;
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
        id: 'nexus-cmd', name: 'Standby for Protocol', concept: '', painPoints: [], solutions: [], presentation: '', features: [], codeFiles: [], logs, currentStage: PipelineStage.RESEARCH
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
    await new Promise(r => setTimeout(r, 1200));
    setActiveFlow(null);
    updateAgent(fromId, { targetId: undefined, status: AgentStatus.COMPLETED });
  }, [updateAgent, addLog]);

  const startFactory = async () => {
    if (isFactoryRunning) return;
    setIsFactoryRunning(true);
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: AgentStatus.IDLE, lastMessage: undefined })));
    
    try {
      await triggerLink('echo', 'echo', 'Initializing deep-market scan...');
      const research = await performResearch('AI-First Creator Economy Platforms');
      setProject(prev => ({ ...prev!, ...research, currentStage: PipelineStage.RESEARCH }));
      
      await triggerLink('echo', 'agent_prd', 'Crafting product requirements...');
      await triggerLink('agent_prd', 'agent_context', 'Analyzing technical environment...');
      
      await triggerLink('agent_context', 'agent_sitemap', 'Navigating user journey...');
      await triggerLink('agent_sitemap', 'agent_db', 'Structuring database schema...');
      const plan = await generateTechnicalPlan(research);
      setProject(prev => ({ ...prev!, currentStage: PipelineStage.ARCHITECTURE }));

      let codeFiles: any[] = [];
      let loop = 0;
      while (loop < 2) {
        loop++;
        await triggerLink('agent_db', 'agent_ui', 'Forging frontend interface...');
        await triggerLink('agent_ui', 'agent_entry', 'Integrating system core...');
        await triggerLink('agent_entry', 'agent_readme', 'Writing technical manual...');
        await triggerLink('agent_readme', 'agent_history', 'Recording logic history...');
        await triggerLink('agent_history', 'agent_pitch', 'Preparing presentation assets...');
        
        codeFiles = await generateCode(research, plan);
        setProject(prev => ({ ...prev!, codeFiles, currentStage: PipelineStage.CODING }));

        await triggerLink('agent_pitch', 'auditor', 'Initiating quality audit...');
        const audit = await auditCode(codeFiles);
        if (audit.status === 'Pass') break;
      }

      await triggerLink('auditor', 'orbit', 'Deploying to Nexus Orbit...');
      const finalUrl = `https://${research.name.toLowerCase().replace(/\s+/g, '-')}.nexus-forge.ai`;
      setProject(prev => ({ ...prev!, vercelUrl: finalUrl, currentStage: PipelineStage.DEPLOYMENT }));
      addLog('Nexus Orbit', `Operational Success. Platform deployed at: ${finalUrl}`, 'success');

    } catch (e: any) {
      addLog('Nexus Error', e.message, 'error');
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
      a.download = `nexus-${project.name.toLowerCase()}.zip`;
      a.click();
    } catch (e: any) {} finally { setIsDownloading(false); }
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
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 flex flex-col gap-6 max-w-[1800px] mx-auto font-sans relative overflow-x-hidden">
      
      {/* Tier 1: Command Header & Workflow Progress */}
      <header className="glass-card rounded-[2.5rem] p-6 md:p-10 flex flex-col gap-8 cyber-border relative overflow-hidden group">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 shadow-2xl animate-float">
              <Cpu className="text-cyan-400" size={40} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Nexus<span className="text-cyan-400">Forge</span></h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase mt-1">Autonomous Multi-Agent Matrix</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="hidden sm:flex items-center bg-slate-900/50 rounded-2xl p-2 border border-white/5 mr-4">
               {STAGES.map((s, i) => {
                 const isActive = project?.currentStage === s.key;
                 return (
                   <React.Fragment key={s.key}>
                     <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600'}`}>
                        <s.icon size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                     </div>
                     {i < STAGES.length - 1 && <ChevronRight size={12} className="text-slate-800 mx-1" />}
                   </React.Fragment>
                 )
               })}
            </div>
            <button 
              onClick={startFactory} 
              disabled={isFactoryRunning} 
              className="flex-1 lg:flex-none px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
            >
              {isFactoryRunning ? <RefreshCcw className="animate-spin" size={18} /> : <Rocket size={18} />}
              {isFactoryRunning ? 'Processing' : 'Initiate Forge'}
            </button>
          </div>
        </div>
      </header>

      {/* Tier 2: The Core Operation (Engine Room) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[650px]">
        {/* Left: Neural Grid Visualization */}
        <div className="lg:col-span-5 glass-card rounded-[3rem] p-8 flex flex-col relative overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] flex items-center gap-2">
                <Layout size={14} /> Neural Grid Matrix
              </h3>
              <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
           </div>
           
           <div className="flex-1 flex items-center justify-center relative">
             <svg viewBox="0 0 500 500" className="w-full max-w-[450px] aspect-square drop-shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <circle cx="250" cy="250" r="180" fill="none" stroke="white" strokeOpacity="0.03" strokeWidth="1" strokeDasharray="10 10" />
                {activeLink && (
                  <path 
                    d={`M ${activeLink.x1} ${activeLink.y1} Q 250 250 ${activeLink.x2} ${activeLink.y2}`}
                    fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="8 8" className="animate-[dash_10s_linear_infinite]"
                  />
                )}
                {agentNodes.map(node => (
                  <g key={node.id}>
                    <circle 
                      cx={node.x} cy={node.y} r="30" 
                      className={`transition-all duration-500 ${node.status === AgentStatus.WORKING ? 'fill-cyan-500/20 stroke-cyan-400 animate-pulse' : 'fill-slate-950 stroke-white/10'}`}
                      strokeWidth="2"
                    />
                    <image href={node.avatar} x={node.x - 20} y={node.y - 20} width="40" height="40" className="rounded-full" />
                  </g>
                ))}
             </svg>
             
             {/* Dynamic Status Overlay */}
             <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-3xl">
                <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                   "{agents.find(a => a.status === AgentStatus.WORKING)?.lastMessage || "Standby for protocol initiation..."}"
                </p>
             </div>
           </div>
        </div>

        {/* Right: Live Execution Console */}
        <div className="lg:col-span-7 flex flex-col glass-card rounded-[3rem] overflow-hidden">
           <div className="bg-slate-900/80 p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex gap-1.5">
                   <div className="h-3 w-3 rounded-full bg-rose-500/50"></div>
                   <div className="h-3 w-3 rounded-full bg-amber-500/50"></div>
                   <div className="h-3 w-3 rounded-full bg-emerald-500/50"></div>
                 </div>
                 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-4">Live Execution Loop v5.0</span>
              </div>
              <Terminal size={18} className="text-slate-600" />
           </div>
           <div className="flex-1 p-8 font-mono text-[13px] overflow-y-auto bg-slate-950/30 custom-scrollbar">
              {project?.logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                   <CpuIcon size={64} className="mb-4" />
                   <p className="uppercase tracking-[0.5em] text-[10px] font-black">Awaiting Stream</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project?.logs.map(log => (
                    <div key={log.id} className="flex gap-6 pb-4 border-b border-white/5 last:border-0">
                       <span className="text-slate-700 shrink-0 w-16">{log.timestamp}</span>
                       <div>
                          <span className="text-cyan-400 text-[10px] font-black uppercase tracking-wider block mb-1">{log.agentName}</span>
                          <p className={`text-slate-200 ${log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : ''}`}>
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
      </div>

      {/* Tier 3: Intelligence Output (Strategy) */}
      {project && project.concept && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="lg:col-span-1 glass-card p-10 rounded-[3rem] border-cyan-500/10 group">
             <div className="p-4 bg-cyan-400/10 rounded-2xl w-fit mb-6 border border-cyan-400/20">
                <Sparkles className="text-cyan-400" />
             </div>
             <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{project.name}</h3>
             <p className="text-sm text-slate-400 leading-relaxed font-medium">{project.concept}</p>
             {project.vercelUrl && (
               <a href={project.vercelUrl} target="_blank" className="mt-8 flex items-center justify-between p-5 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600/20 transition-all">
                 Launch Platform <ExternalLink size={14} />
               </a>
             )}
          </div>

          <div className="glass-card p-10 rounded-[3rem] border-rose-500/10">
             <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <AlertTriangle size={14} /> Critical Pain Points
             </h4>
             <div className="space-y-3">
                {project.painPoints.map((p, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-slate-900/40 p-5 rounded-2xl border border-white/5 font-medium leading-relaxed">
                    {p}
                  </div>
                ))}
             </div>
          </div>

          <div className="glass-card p-10 rounded-[3rem] border-emerald-500/10">
             <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Zap size={14} /> Optimized Solutions
             </h4>
             <div className="space-y-3">
                {project.solutions.map((s, i) => (
                  <div key={i} className="text-xs text-slate-100 bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Tier 4: Artifact Vault (Final Delivery) */}
      {project && project.codeFiles.length > 0 && (
        <section className="glass-card p-10 md:p-14 rounded-[4rem] relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-6">
                 <div className="p-5 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                    <Layers className="text-indigo-400" size={32} />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Artifact Repository</h2>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Decentralized Module Production Complete</p>
                 </div>
              </div>
              <button 
                onClick={handleDownload} 
                className="px-8 py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
              >
                <Download size={18} /> Export Grid Bundle
              </button>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {project.codeFiles.map((file, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedFile(file)}
                  className="p-6 bg-slate-900/40 hover:bg-cyan-400/10 border border-white/5 hover:border-cyan-400/30 rounded-[2rem] transition-all flex flex-col items-center gap-4 text-center group"
                >
                  <div className="p-4 bg-slate-950 rounded-2xl text-slate-600 group-hover:text-cyan-400 transition-colors">
                    {getFileIcon(file.path)}
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden w-full">
                    <span className="text-[11px] font-bold text-slate-200 truncate block w-full uppercase tracking-tight">{file.path}</span>
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Inspection Ready</span>
                  </div>
                </button>
              ))}
           </div>
        </section>
      )}

      {/* Modal & Ambience as before... */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
           <div className="glass-card w-full max-w-6xl max-h-[85vh] rounded-[3rem] flex flex-col overflow-hidden cyber-border">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                 <div className="flex items-center gap-6">
                    {getFileIcon(selectedFile.path)}
                    <h3 className="text-xl font-black text-cyan-400 tracking-wider uppercase font-mono">{selectedFile.path}</h3>
                 </div>
                 <button onClick={() => setSelectedFile(null)} className="p-4 hover:bg-white/5 rounded-full transition-all"><X size={32} /></button>
              </div>
              <div className="flex-1 overflow-auto p-10 font-mono text-sm leading-relaxed text-slate-300 bg-slate-950/20">
                 <pre><code>{selectedFile.content}</code></pre>
              </div>
           </div>
        </div>
      )}

      <footer className="mt-12 text-center opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">NexusForge Intelligence Matrix &copy; 2025</p>
      </footer>

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -100; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
