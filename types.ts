
export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum PipelineStage {
  RESEARCH = 'RESEARCH',
  ARCHITECTURE = 'ARCHITECTURE',
  CODING = 'CODING',
  QA = 'QA',
  DEPLOYMENT = 'DEPLOYMENT'
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  stage: PipelineStage;
  status: AgentStatus;
  lastMessage?: string;
  avatar: string;
}

export interface ConnectionState {
  github: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'AUTH_REQUIRED';
  vercel: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  githubRepo?: string;
  githubUser?: string;
}

export interface ProjectState {
  id: string;
  name: string;
  concept: string;
  features: string[];
  codeFiles: Array<{ path: string; content: string }>;
  githubUrl?: string;
  vercelUrl?: string;
  logs: LogEntry[];
  currentStage: PipelineStage;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'code';
}
