export type AgentPhase = 
  | 'planning'
  | 'research'
  | 'generation'
  | 'complete'
  | 'discovery'
  | 'enrichment'
  | 'email'
  | 'idle'
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
  email?: string;
  message?: {
    subject: string;
    body: string;
    personalization: string[];
    confidence?: number;
    wordCount?: number;
    emailType?: string;
  };
  research: {
    insights: string[];
    painPoints?: string[];
    opportunities?: string[];
  };
}

export interface AgentCriteria {
  industry?: string;
  location?: string;
  companySize?: string;
  role?: string;
}

export interface ProductInfo {
  name: string;
  description: string;
  features: string[];
  benefits: string[];
}

export interface AgentInput {
  query?: string;
  criteria?: AgentCriteria;
  productInfo?: ProductInfo;
  prospects?: Prospect[];
  customizations?: {
    tone?: string;
    style?: string;
    objective?: string;
  };
}

export interface AgentUpdate {
  type?: string;
  phase: AgentPhase;
  progress: number;
  message?: string;
  error?: string;
  timestamp?: number;
  thinking?: string;
  results?: {
    prospects?: Prospect[];
    emails?: string[];
  };
}
