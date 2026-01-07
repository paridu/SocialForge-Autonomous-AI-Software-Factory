
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentStatus, PipelineStage, AIAgent, ProjectState, LogEntry, ConnectionState } from './types';
import { performResearch, generateCode, auditCode } from './services/geminiService';
import { Terminal, Code, Cpu, Rocket, Search, ShieldCheck, Factory, Zap, Github, Globe, Link, CheckCircle2, AlertTriangle, ExternalLink, User, Lock, ChevronRight, X, Download, FileJson, FileText, Presentation, BookOpen, Users, BarChart3, ShieldAlert } from 'lucide-react';
import JSZip from 'jszip';

const INITIAL_AGENTS: AIAgent[] = [
  { 
    id: '1', 
    name: 'Agent Echo', 
    role: 'Viral Niche Algorithmic Scout', 
    description: 'วิเคราะห์อัลกอริทึมและค้นหาช่องว่างทางการตลาดแบบ Viral เพื่อสร้างความได้เปรียบในการเติบโตในโลกโซเชียลยุค 2025', 
    stage: PipelineStage.RESEARCH, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=echo' 
  },
  { 
    id: '2', 
    name: 'Agent Nexus', 
    role: 'Engagement Logic & Schema Strategist', 
    description: 'วางกลยุทธ์ตรรกะการมีส่วนร่วมและออกแบบโครงสร้าง Social Graph ที่เน้นการรักษาฐานผู้ใช้ (Retention)', 
    stage: PipelineStage.ARCHITECTURE, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus' 
  },
  { 
    id: '3', 
    name: 'Agent Forge', 
    role: 'Rapid Social Interface Engineer', 
    description: 'วิศวกรสร้างอินเทอร์เฟซโซเชียลประสิทธิภาพสูง (High-Performance) ที่เน้นความเร็วในการแชร์และ UI/UX ที่ลื่นไหล', 
    stage: PipelineStage.CODING, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=forge' 
  },
  { 
    id: '4', 
    name: 'Agent Scribe', 
    role: 'Documentation & Pitch Specialist', 
    description: 'รับผิดชอบการเขียน README.md และ Presentation.md เพื่อสื่อสาร Pain Points และ Solutions ให้ชัดเจน', 
    stage: PipelineStage.CODING, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=scribe' 
  },
  { 
    id: '5', 
    name: 'Agent Growth', 
    role: 'Viral Loop Architect', 
    description: 'ออกแบบระบบเชิญเพื่อนและแรงจูงใจในการแชร์ให้เกิด Network Effect สูงสุด', 
    stage: PipelineStage.ARCHITECTURE, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=growth' 
  },
  { 
    id: '6', 
    name: 'Agent Sentry', 
    role: 'Trust, Safety & Security Auditor', 
    description: 'ผู้ตรวจสอบความปลอดภัยของข้อมูล ความเป็นส่วนตัว และระบบกรองเนื้อหาตามมาตรฐานสากล', 
    stage: PipelineStage.QA, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sentry' 
  },
  { 
    id: '7', 
    name: 'Agent Orbit', 
    role: 'Multi-Cloud Social Scaling Engine', 
    description: 'ระบบจัดการการติดตั้งและขยายตัวบนเครือข่าย Edge เพื่อรองรับการเติบโตแบบทวีคูณ (Hyper-growth)', 
    stage: PipelineStage.DEPLOYMENT, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=orbit' 
  },
  { 
    id: '8', 
    name: 'Agent Analyst', 
    role: 'Behavioral Data Modeler', 
    description: 'สร้างโมเดลจำลองพฤติกรรมผู้ใช้เพื่อพยากรณ์โอกาสที่คอนเทนต์จะเป็นไวรัล', 
    stage: PipelineStage.RESEARCH, 
    status: AgentStatus.IDLE, 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=analyst' 
  }
];

const MOCK_REPOS = [
  'social-forge-v1',
  'viral-loops-main',
  'creator-dashboards',
  'ai-social-feed-engine'
];

const App: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AGENTS);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [connections, setConnections] = useState<ConnectionState>({
    github: 'DISCONNECTED',
    vercel: 'DISCONNECTED'
  });
  const [isFactoryRunning, setIsFactoryRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ path: string, content: string } | null>(null);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubAuthStep, setGithubAuthStep] = useState<'login' | 'repo'>('login');
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
    setProject(prev => {
      if (!prev) {
        return {
          id: 'init', name: 'กำลังเริ่มต้น...', concept: '', features: [], codeFiles: [], logs: [newLog], currentStage: PipelineStage.RESEARCH
        };
      }
      return { ...prev, logs: [...prev.logs, newLog] };
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

  const handleConnect = async (service: 'github' | 'vercel') => {
    if (service === 'github') {
      setShowGithubModal(true);
      setGithubAuthStep('login');
    } else {
      setConnections(prev => ({ ...prev, [service]: 'CONNECTING' }));
      await new Promise(r => setTimeout(r, 1000));
      setConnections(prev => ({ ...prev, [service]: 'CONNECTED' }));
      addLog('ระบบ', `เชื่อมต่อ ${service.toUpperCase()} สำเร็จ`, 'success');
    }
  };

  const finalizeGithubConnection = (repo: string) => {
    setConnections(prev => ({
      ...prev,
      github: 'CONNECTED',
      githubRepo: repo,
      githubUser: 'ForgeEngineer'
    }));
    setShowGithubModal(false);
    addLog('ระบบ', `ยืนยันตัวตน GitHub สำเร็จ ใช้ Repository: ${repo}`, 'success');
  };

  const handleDownloadAll = async () => {
    if (!project?.codeFiles || project.codeFiles.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      project.codeFiles.forEach(file => { zip.file(file.path, file.content); });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-production-package.zip`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      addLog('ระบบ', 'ดาวน์โหลด ZIP Package สำเร็จ รวมเอกสารประกอบและซอร์สโค้ด', 'success');
    } catch (err) {
      addLog('ระบบ', 'เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const startFactory = async () => {
    if (isFactoryRunning) return;
    if (connections.github !== 'CONNECTED' || connections.vercel !== 'CONNECTED') {
      addLog('ระบบ', 'กรุณาเชื่อมต่อ GitHub และ Vercel ก่อนเริ่มการผลิต', 'error');
      return;
    }
    setIsFactoryRunning(true);
    try {
      updateAgent('1', { status: AgentStatus.THINKING, lastMessage: 'วิเคราะห์ Niche...' });
      updateAgent('8', { status: AgentStatus.THINKING, lastMessage: 'วิเคราะห์ข้อมูลพฤติกรรม...' });
      const research = await performResearch('Future Social Economy');
      setProject(prev => ({ ...prev!, name: research.name, concept: research.concept, features: research.features, currentStage: PipelineStage.RESEARCH }));
      updateAgent('1', { status: AgentStatus.COMPLETED });
      updateAgent('8', { status: AgentStatus.COMPLETED });

      updateAgent('2', { status: AgentStatus.WORKING, lastMessage: 'ออกแบบสถาปัตยกรรม...' });
      updateAgent('5', { status: AgentStatus.WORKING, lastMessage: 'วางตรรกะ Viral Loop...' });
      await new Promise(r => setTimeout(r, 2000));
      updateAgent('2', { status: AgentStatus.COMPLETED });
      updateAgent('5', { status: AgentStatus.COMPLETED });

      updateAgent('3', { status: AgentStatus.THINKING, lastMessage: 'ผลิต React Module...' });
      updateAgent('4', { status: AgentStatus.THINKING, lastMessage: 'เขียน README & Pitch Deck...' });
      const files = await generateCode(research.name, research.concept, research.features);
      setProject(prev => prev ? { ...prev, codeFiles: files, currentStage: PipelineStage.CODING } : null);
      updateAgent('3', { status: AgentStatus.COMPLETED });
      updateAgent('4', { status: AgentStatus.COMPLETED });

      updateAgent('6', { status: AgentStatus.WORKING, lastMessage: 'Audit ความปลอดภัย...' });
      const audit = await auditCode(files);
      addLog('Agent Sentry', `Audit Report: ${audit.status}`, audit.status === 'Pass' ? 'success' : 'warning');
      updateAgent('6', { status: AgentStatus.COMPLETED });

      updateAgent('7', { status: AgentStatus.WORKING, lastMessage: 'Deploying to Edge...' });
      await new Promise(r => setTimeout(r, 2000));
      const vercelUrl = `https://${research.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app`;
      setProject(prev => prev ? { ...prev, vercelUrl, currentStage: PipelineStage.DEPLOYMENT } : null);
      updateAgent('7', { status: AgentStatus.COMPLETED });
      addLog('Agent Orbit', `แอปพลิเคชันออนไลน์: ${vercelUrl}`, 'success');
    } catch (err: any) {
      addLog('ระบบ', `Error: ${err.message}`, 'error');
    } finally {
      setIsFactoryRunning(false);
    }
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.md')) {
      if (path.toLowerCase().includes('presentation')) return <Presentation size={16} />;
      if (path.toLowerCase().includes('readme')) return <BookOpen size={16} />;
      return <FileText size={16} />;
    }
    return <Code size={16} />;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass p-6 rounded-2xl shadow-2xl border-indigo-500/20">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg shadow-indigo-500/30">
            <Factory className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300 tracking-tight">
              SOCIAL FORGE <span className="text-[10px] bg-indigo-500/20 text-indigo-400 py-1 px-2 rounded-full align-middle border border-indigo-500/30 uppercase">Army of Agents</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">โรงงานผลิตซอฟต์แวร์โดยกองทัพ AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={startFactory}
            disabled={isFactoryRunning}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-xl ${
              isFactoryRunning 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 shadow-indigo-500/20'
            }`}
          >
            {isFactoryRunning ? <Zap className="animate-spin" size={20} /> : <Rocket size={20} />}
            {isFactoryRunning ? 'กำลังปฏิบัติการ...' : 'เคลื่อนทัพ AI'}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <aside className="lg:col-span-3 flex flex-col gap-6 max-h-screen overflow-y-auto pr-2 custom-scrollbar">
          <div className="glass p-5 rounded-2xl border-white/5">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Link size={14} /> Infrastructure
            </h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleConnect('github')} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 transition-all text-sm group">
                <div className="flex items-center gap-3">
                  <Github size={18} className={connections.github === 'CONNECTED' ? 'text-indigo-400' : 'text-slate-500'} />
                  <span className="font-semibold">GitHub Engine</span>
                </div>
                {connections.github === 'CONNECTED' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
              </button>
              <button onClick={() => handleConnect('vercel')} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all text-sm group">
                <div className="flex items-center gap-3">
                  <Globe size={18} className={connections.vercel === 'CONNECTED' ? 'text-blue-400' : 'text-slate-500'} />
                  <span className="font-semibold">Vercel Edge</span>
                </div>
                {connections.vercel === 'CONNECTED' ? <CheckCircle2 size={16} className="text-blue-500" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
              <Users size={14} /> Agent Command Center
            </h2>
            {agents.map(agent => (
              <div key={agent.id} className={`glass p-4 rounded-2xl transition-all duration-500 border-l-4 ${
                agent.status === AgentStatus.WORKING || agent.status === AgentStatus.THINKING ? 'border-indigo-500 bg-indigo-500/10' : 
                agent.status === AgentStatus.COMPLETED ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5'
              }`}>
                <div className="flex items-center gap-3">
                  <img src={agent.avatar} className="w-10 h-10 rounded-xl bg-slate-800 p-1" alt={agent.name} />
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-xs truncate">{agent.name}</h3>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter truncate">{agent.role}</p>
                  </div>
                </div>
                {agent.lastMessage && (
                  <p className="text-[10px] text-slate-400 mt-2 font-medium italic truncate">"{agent.lastMessage}"</p>
                )}
              </div>
            ))}
          </div>
        </aside>

        <section className="lg:col-span-9 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {project && (
              <>
                <div className="glass p-6 rounded-2xl border-indigo-500/20 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Search size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pain Points</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{project.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">มุ่งเน้นการแก้ปัญหา {project.concept}</p>
                </div>
                <div className="glass p-6 rounded-2xl border-purple-500/20 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <Zap size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Core Solution</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    {project.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass p-6 rounded-2xl border-emerald-500/20 group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Globe size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                  </div>
                  {project.vercelUrl ? (
                    <a href={project.vercelUrl} target="_blank" className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group/link">
                      <span className="text-[10px] text-emerald-400 font-bold">LIVE NOW</span>
                      <ExternalLink size={14} className="text-emerald-400" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">เตรียมติดตั้งระบบ...</p>
                  )}
                </div>
              </>
             )}
          </div>

          <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden border-white/5 min-h-[400px]">
            <div className="bg-slate-900/80 p-4 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Production Pipeline Terminal</span>
              <Terminal size={14} className="text-slate-600" />
            </div>
            <div className="flex-1 p-6 font-mono text-[12px] overflow-y-auto bg-slate-950/20">
              {project?.logs.map(log => (
                <div key={log.id} className="mb-2 flex gap-4 animate-in fade-in slide-in-from-left-1">
                  <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                  <div className="flex flex-col">
                    <span className="text-indigo-400 font-bold text-[10px] uppercase">[{log.agentName}]</span>
                    <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-red-400' : 'text-slate-300'}>{log.message}</span>
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {project?.codeFiles && project.codeFiles.length > 0 && (
            <div className="glass p-8 rounded-3xl border-white/5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-black text-white text-lg">คลังสินค้า (Production Assets)</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Code, README, and Presentations</p>
                </div>
                <button onClick={handleDownloadAll} disabled={isDownloading} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xl shadow-indigo-500/20 transition-all">
                  {isDownloading ? <Zap className="animate-spin" size={14} /> : <Download size={14} />}
                  ดาวน์โหลด ZIP ทั้งหมด
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {project.codeFiles.map((file, i) => (
                  <button key={i} onClick={() => setSelectedFile(file)} className="flex flex-col p-4 bg-slate-950/50 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-slate-900 rounded-lg text-slate-500 group-hover:text-indigo-400 transition-colors">
                        {getFileIcon(file.path)}
                      </div>
                      <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white">{file.path}</span>
                    </div>
                    <div className="mt-auto flex justify-between items-center text-[9px] font-black text-slate-600 uppercase">
                      <span>{file.path.endsWith('.md') ? 'Document' : 'Module'}</span>
                      <span>{Math.round(file.content.length / 1024 * 10) / 10} KB</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Code Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-sm text-indigo-400 font-bold">
                {getFileIcon(selectedFile.path)} {selectedFile.path}
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            <pre className="flex-1 overflow-auto p-8 font-mono text-[13px] text-slate-300 bg-slate-950/50 leading-relaxed custom-scrollbar">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      )}

      {/* GitHub Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900/70 border border-indigo-500/30 rounded-[2.5rem] w-full max-w-md p-10 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95">
             <div className="flex items-center gap-4 mb-8">
                <Github size={32} className="text-indigo-400" />
                <h3 className="text-xl font-black text-white">GitHub Forge Access</h3>
             </div>
             {githubAuthStep === 'login' ? (
               <div className="space-y-6">
                 <input type="text" placeholder="GitHub Username" defaultValue="ForgeEngineer" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500 outline-none" />
                 <input type="password" placeholder="Access Token (ghp_...)" defaultValue="ghp_****************" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:border-indigo-500 outline-none" />
                 <button onClick={() => setGithubAuthStep('repo')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all">ถัดไป</button>
               </div>
             ) : (
               <div className="space-y-4">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-2">เลือก Repository เป้าหมาย:</p>
                 {MOCK_REPOS.map(repo => (
                   <button key={repo} onClick={() => finalizeGithubConnection(repo)} className="w-full p-4 bg-slate-950/50 hover:bg-indigo-500/10 border border-white/5 rounded-xl text-left text-sm font-bold text-slate-300 transition-all">{repo}</button>
                 ))}
               </div>
             )}
             <button onClick={() => setShowGithubModal(false)} className="w-full mt-6 text-[10px] text-slate-500 uppercase font-black hover:text-white transition-colors">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
