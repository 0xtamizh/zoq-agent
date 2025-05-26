// src/types/prospect-types.ts - ENHANCED WITH STRUCTURED TYPES
export interface PeopleCard {
  name: string;
  company?: string;
  role?: string;
  linkedinUrl?: string | null;
  companyUrl?: string | null;
  email?: string | null;
  location?: string;
  confidence: number;
  summary?: string;
}

export interface DiscoveryResponse {
  people: PeopleCard[];
  searchQueries: string[];
  totalSearches: number;
  status: string;
  error?: string;
}

export interface EnrichedProfile {
  name: string;
  company: string;
  role: string;
  personalInfo: {
    linkedinUrl?: string;
    email?: string;
    phone?: string;
    location?: string;
    education?: string;
    previousCompanies?: string[];
  };
  companyInfo: {
    companyUrl?: string;
    companyLinkedinUrl?: string;
    fundingStage?: string;
    fundingAmount?: string;
    teamSize?: number;
    foundedYear?: number;
    mainProduct?: string;
  };
  keyInsights: string[];
  recentActivity: string[];
  confidence: number;
  emailSignals: {
    painPoints: string[];
    opportunities: string[];
    personalizedHooks: string[];
    currentChallenges: string[];
  };
}

export interface EnrichmentResponse {
  enrichedProfiles: EnrichedProfile[];
  totalSearches: number;
  sourcesScraped: number;
  status: string;
  processingSteps: string[];
}

export interface PersonalizedEmail {
  recipientName: string;
  recipientEmail: string;
  recipientCompany: string;
  subject: string;
  body: string;
  personalizationPoints: string[];
  confidence: number;
  emailType: string;
  wordCount: number;
}

export interface EmailResponse {
  emails: PersonalizedEmail[];
  totalEmails: number;
  averagePersonalization: number;
  averageConfidence: number;
  emailType: string;
  status: string;
  message?: string;
  generationTime: string;
}

// Master Agent Response Types
export interface ExecutionPlan {
  intent: string;
  searchQueries: string[];
  userProfile: UserProfile;
  emailType: string;
  targetCount: number;
}

export interface UserProfile {
  name: string;
  company: string;
  valueProposition: string;
  caseStudy?: string;
  skills?: string;
  industry?: string;
}

export interface MasterExecutionResult {
  success: boolean;
  executionPlan: ExecutionPlan | null;
  discoveryData: DiscoveryResponse | string;
  enrichmentData: EnrichmentResponse | string;
  emailsGenerated: EmailResponse | string;
  timing: {
    total: string;
    discovery: string;
    enrichment: string;
    emailWriting: string;
  };
  attemptNumber: number;
  timestamp: string;
  error?: string;
  lastError?: string;
  totalAttempts?: number;
}

// UI Status Updates (for future frontend integration)
export interface StatusUpdate {
  type: 'info' | 'success' | 'error' | 'progress';
  phase: 'planning' | 'discovery' | 'enrichment' | 'email_writing' | 'complete';
  message: string;
  timestamp: string;
  data?: any;
}

// Processing Steps for Logging
export interface ProcessingStep {
  step: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  details?: string;
  duration?: number;
  timestamp: string;
}