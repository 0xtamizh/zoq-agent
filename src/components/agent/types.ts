// src/lib/agent/types.ts - FRONTEND AGENT TYPES
export interface AgentInput {
    query: string;
    criteria?: string;
    productInfo?: {
      name?: string;
      description?: string;
      valueProposition?: string;
    };
  }
  
  export interface AgentUpdate {
    type: 'status' | 'data' | 'progress' | 'error';
    phase: AgentPhase;
    message: string;
    progress?: number;
    thinking?: string;
    timestamp: string;
    data?: any;
    results?: Prospect[];
    error?: string;
  }
  
  export type AgentPhase = 
    | 'planning' 
    | 'discovery' 
    | 'research'    // Maps to 'enrichment' on backend
    | 'generation'  // Maps to 'email_writing' on backend
    | 'complete' 
    | 'error';
  
  export interface Prospect {
    id: string;
    name: string;
    company: string;
    role?: string;
    location?: string;
    linkedInUrl?: string | null;
    companyUrl?: string | null;
    imageUrl?: string | null;
    confidence?: number;
    message?: {
      subject: string;
      body: string;
      personalization: string[];
    };
    research: {
      insights: string[];
      painPoints?: string[];
      opportunities?: string[];
    };
  }
  
  // For backwards compatibility with existing components
  export interface LegacyProspect {
    name: string;
    company: string;
    role: string;
    email?: string;
    linkedInUrl?: string;
    location?: string;
  }