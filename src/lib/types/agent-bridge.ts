// src/lib/types/agent-bridge.ts - BRIDGE STATUSMANAGER TO FRONTEND
import { StatusUpdate } from '@/types/prospect-types';
import { AgentUpdate, AgentPhase, Prospect } from '@/lib/agent/types';
import { PersonalizedEmail, EnrichedProfile } from '@/types/prospect-types';

// StatusManager Phase → Frontend Phase mapping
export const PHASE_MAPPING: Record<string, AgentPhase> = {
  planning: 'discovery',
  research: 'enrichment',
  generation: 'email',
  complete: 'idle',
  error: 'error'
};

// Progress mapping for different phases
export const PROGRESS_MAPPING: Record<string, number> = {
  planning: 10,
  discovery: 30,
  enrichment: 60,
  email: 80,
  idle: 100,
  error: 0
};

// Convert StatusManager update to Frontend AgentUpdate
export function statusUpdateToAgentUpdate(statusUpdate: any): AgentUpdate {
  const phase = PHASE_MAPPING[statusUpdate.phase] || 'error';
  const progress = PROGRESS_MAPPING[statusUpdate.phase] || 0;

  return {
    type: statusUpdate.type,
    phase,
    progress: typeof progress === 'string' ? parseInt(progress, 10) : progress,
    message: statusUpdate.message,
    error: statusUpdate.error,
    timestamp: Date.now()
  };
}

export interface AgentBridgeResponse extends AgentUpdate {
  results?: {
    prospects?: Prospect[];
    emails?: string[];
  };
}

// Convert MasterExecutionResult to Frontend Prospects
export function masterResultToProspects(result: any): Prospect[] {
  const prospects: Prospect[] = [];
  
  try {
    // Parse email data
    const emailData = typeof result.emailsGenerated === 'string' 
      ? JSON.parse(result.emailsGenerated) 
      : result.emailsGenerated;
      
    // Parse discovery data  
    const discoveryData = typeof result.discoveryData === 'string'
      ? JSON.parse(result.discoveryData)
      : result.discoveryData;
      
    // Parse enrichment data
    const enrichmentData = typeof result.enrichmentData === 'string'
      ? JSON.parse(result.enrichmentData)
      : result.enrichmentData;
    
    if (emailData?.emails && Array.isArray(emailData.emails)) {
      emailData.emails.forEach((email: PersonalizedEmail, index: number) => {
        const discoveryPerson = discoveryData?.people?.[index];
        const enrichedProfile = enrichmentData?.enrichedProfiles?.[index];
        
        const prospect: Prospect = {
          id: `prospect-${index}-${Date.now()}`, // Generate a unique ID
          name: email.recipientName || discoveryPerson?.name || 'Unknown',
          company: email.recipientCompany || discoveryPerson?.company || 'Unknown Company',
          role: discoveryPerson?.role || enrichedProfile?.role || 'Professional',
          location: discoveryPerson?.location || enrichedProfile?.personalInfo?.location || '',
          linkedInUrl: discoveryPerson?.linkedinUrl || enrichedProfile?.personalInfo?.linkedinUrl || null,
          companyUrl: discoveryPerson?.companyUrl || enrichedProfile?.companyInfo?.companyUrl || null,
          imageUrl: null, // Could be added from LinkedIn scraping later
          research: {
            insights: enrichedProfile?.insights || discoveryPerson?.insights || []
          }
        };
        
        prospects.push(prospect);
      });
    }
  } catch (error) {
    console.error('❌ Error converting master result to prospects:', error);
  }
  
  return prospects;
}

// Enhanced status messages for better UX
export const STATUS_MESSAGES: Record<string, Record<string, string>> = {
  planning: {
    start: '🎯 Analyzing your request and planning search strategy...',
    progress: '📋 Preparing search queries and target criteria...',
    complete: '✅ Search strategy ready - moving to discovery phase'
  },
  discovery: {
    start: '🔍 Searching for prospects across multiple platforms...',
    progress: '📊 Found potential matches, filtering and validating...',
    complete: '✅ Discovery complete - found high-quality prospects'
  },
  enrichment: {
    start: '🔬 Researching prospect profiles and company information...',
    progress: '📈 Gathering insights, recent activity, and pain points...',
    complete: '✅ Research complete - rich prospect profiles ready'
  },
  email_writing: {
    start: '✍️ Crafting personalized outreach messages...',
    progress: '🎨 Adding personalization hooks and value propositions...',
    complete: '✅ Personalized emails generated successfully'
  }
};

// Get enhanced status message
export function getEnhancedStatusMessage(phase: string, stage: 'start' | 'progress' | 'complete' = 'progress'): string {
  return STATUS_MESSAGES[phase]?.[stage] || `Processing ${phase}...`;
}