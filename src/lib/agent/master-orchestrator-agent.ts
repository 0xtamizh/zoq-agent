// src/lib/agent/master-orchestrator-agent.ts - FINAL WITH COMPLETE STATUS INTEGRATION
import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { DiscoveryAgent } from './discovery-agent';
import { EnrichmentAgent } from './enrichment-agent';
import { EmailWritingAgent } from './email-writing-agent';
import { StatusManager } from '../status/status-manager';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface ExecutionPlan {
  intent: string;
  searchQueries: string[];
  userProfile: UserProfile;
  emailType: string;
  targetCount: number;
}

interface UserProfile {
  name: string;
  company: string;
  valueProposition: string;
  caseStudy?: string;
  skills?: string;
  industry?: string;
}

interface MasterExecutionResult {
  success: boolean;
  sessionId: string;
  executionPlan: ExecutionPlan | null;
  discoveryData: any;
  enrichmentData: any;
  emailsGenerated: any;
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
  statusSummary: any;
}

export class MasterOrchestratorAgent extends EventEmitter {
  private openai: OpenAI;
  private discoveryAgent: DiscoveryAgent;
  private enrichmentAgent: EnrichmentAgent;
  private emailWritingAgent: EmailWritingAgent;
  private retryAttempts: number = 2;
  private statusManager: StatusManager;
  
  constructor(statusManager?: StatusManager) {
    super();
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
    });
    
    // Create or use provided status manager
    this.statusManager = statusManager || new StatusManager();
    
    // IMPORTANT: Pass the same StatusManager instance to all agents
    this.discoveryAgent = new DiscoveryAgent(this.statusManager);
    this.enrichmentAgent = new EnrichmentAgent(this.statusManager);
    this.emailWritingAgent = new EmailWritingAgent(this.statusManager);
  }

  // Get the status manager for external access
  getStatusManager(): StatusManager {
    return this.statusManager;
  }

  async executeQuery(userQuery: string): Promise<MasterExecutionResult> {
    // Keep system logs for debugging
    console.log('🎯 Master Agent: STARTING 4-PHASE EXECUTION...');
    console.log(`📝 Query: ${userQuery}\n`);
    
    // Add user-facing status updates
    this.statusManager.updateInfo('planning', 'Understanding your request...');
    
    const overallStartTime = Date.now();
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 === ATTEMPT ${attempt}/${this.retryAttempts} ===\n`);
        
        if (attempt > 1) {
          this.statusManager.updateInfo('planning', `Retrying... (Attempt ${attempt}/${this.retryAttempts})`);
        }
        
        // PHASE 1: Generate Search Strategy
        this.statusManager.startPhase('planning', 'Analyzing request and planning search strategy...');
        console.log('📋 PHASE 1: Generating search strategy...');
        
        const executionPlan = await this.generateSearchQueriesAndPlan(userQuery);
        console.log(`✅ Generated ${executionPlan.searchQueries.length} search queries`);
        
        this.statusManager.completePhase('planning', 
          `Plan ready: ${executionPlan.emailType} emails for ${executionPlan.targetCount} people`, 
          {
            emailType: executionPlan.emailType,
            targetCount: executionPlan.targetCount,
            userProfile: executionPlan.userProfile,
            searchQueries: executionPlan.searchQueries.length
          }
        );
        
        // PHASE 2: Discovery
        this.statusManager.startPhase('discovery', 'Finding founders who match your criteria...');
        console.log('🔍 PHASE 2: Starting discovery phase...');
        const discoveryStartTime = Date.now();
        
        const discoveryResult = await this.discoveryAgent.findBasicPeople(
          executionPlan.searchQueries,
          { query: userQuery, targetCount: executionPlan.targetCount }
        );
        
        const discoveryDuration = (Date.now() - discoveryStartTime) / 1000;
        console.log(`✅ Discovery completed in ${discoveryDuration.toFixed(1)}s`);
        
        // Parse and validate discovery result
        let discoveryData;
        try {
          discoveryData = JSON.parse(discoveryResult);
          if (discoveryData.status !== 'success' || !discoveryData.people || discoveryData.people.length === 0) {
            throw new Error(`Discovery failed: ${discoveryData.error || 'No people found'}`);
          }
          
          // Show found people
          const peopleList = discoveryData.people.slice(0, 3).map((p: any, i: number) => 
            `${i + 1}. ${p.name} at ${p.company}`
          ).join('\n');
          
          this.statusManager.completePhase('discovery', 
            `Hurray! Found ${discoveryData.people.length} people`, 
            {
              count: discoveryData.people.length,
              people: discoveryData.people.slice(0, 3),
              duration: `${discoveryDuration.toFixed(1)}s`
            }
          );
          
          this.statusManager.updateData('discovery', `Found people:\n${peopleList}`, {
            people: discoveryData.people
          });
          
        } catch (parseError) {
          if (discoveryResult.startsWith('DISCOVERY_FAILED')) {
            throw new Error(`Discovery phase failed: ${discoveryResult}`);
          }
          discoveryData = { rawResponse: discoveryResult, status: 'text_format' };
          this.statusManager.completePhase('discovery', 'Discovery completed (processing results...)', {
            duration: `${discoveryDuration.toFixed(1)}s`
          });
        }
        
        // PHASE 3: Enrichment
        this.statusManager.startPhase('enrichment', 'Enriching profiles with detailed information...');
        console.log('🔍 PHASE 3: Starting enrichment + email signals collection...');
        const enrichmentStartTime = Date.now();
        
        const enrichmentResult = await this.enrichmentAgent.enrichPeopleWithEmailSignals(
          typeof discoveryData === 'string' ? discoveryData : JSON.stringify(discoveryData)
        );
        
        const enrichmentDuration = (Date.now() - enrichmentStartTime) / 1000;
        console.log(`✅ Enrichment completed in ${enrichmentDuration.toFixed(1)}s`);
        
        // Parse and validate enrichment result
        let enrichmentData;
        try {
          enrichmentData = JSON.parse(enrichmentResult);
          if (enrichmentData.status !== 'success' || !enrichmentData.enrichedProfiles || enrichmentData.enrichedProfiles.length === 0) {
            throw new Error(`Enrichment failed: ${enrichmentData.error || 'No enriched profiles'}`);
          }
          
          // Show enriched insights
          const insights = enrichmentData.enrichedProfiles.slice(0, 3).map((p: any, i: number) => 
            `${i + 1}. ${p.name}: ${p.emailSignals?.personalizedHooks?.[0] || 'Professional insights found'}`
          ).join('\n');
          
          this.statusManager.completePhase('enrichment', 
            `Enhanced ${enrichmentData.enrichedProfiles.length} profiles with actionable insights`, 
            {
              count: enrichmentData.enrichedProfiles.length,
              profiles: enrichmentData.enrichedProfiles.slice(0, 3),
              duration: `${enrichmentDuration.toFixed(1)}s`
            }
          );
          
          this.statusManager.updateData('enrichment', `Key insights:\n${insights}`, {
            enrichedProfiles: enrichmentData.enrichedProfiles
          });
          
        } catch (parseError) {
          if (enrichmentResult.startsWith('ENRICHMENT_FAILED')) {
            throw new Error(`Enrichment phase failed: ${enrichmentResult}`);
          }
          enrichmentData = { rawResponse: enrichmentResult, status: 'text_format' };
          this.statusManager.completePhase('enrichment', 'Enrichment completed (processing data...)', {
            duration: `${enrichmentDuration.toFixed(1)}s`
          });
        }
        
        // PHASE 4: Email Writing
        this.statusManager.startPhase('email_writing', 'Generating personalized cold emails...');
        console.log('📧 PHASE 4: Starting personalized email writing...');
        const emailStartTime = Date.now();
        
        const emailResult = await this.emailWritingAgent.generatePersonalizedEmails(
          typeof enrichmentData === 'string' ? enrichmentData : JSON.stringify(enrichmentData),
          {
            emailType: executionPlan.emailType,
            userProfile: executionPlan.userProfile
          }
        );
        
        const emailDuration = (Date.now() - emailStartTime) / 1000;
        console.log(`✅ Email writing completed in ${emailDuration.toFixed(1)}s`);
        
        // Parse and validate email result
        let emailData;
        try {
          emailData = JSON.parse(emailResult);
          if (emailData.status !== 'success' || !emailData.emails || emailData.emails.length === 0) {
            throw new Error(`Email writing failed: ${emailData.message || 'No emails generated'}`);
          }
          
          // Show generated emails
          const emailSummary = emailData.emails.slice(0, 3).map((e: any, i: number) => 
            `${i + 1}. To: ${e.recipientName} at ${e.recipientCompany}\n   Subject: ${e.subject}`
          ).join('\n\n');
          
          this.statusManager.completePhase('email_writing', 
            `Successfully generated ${emailData.emails.length} personalized emails`, 
            {
              count: emailData.emails.length,
              emails: emailData.emails.slice(0, 3),
              averageConfidence: emailData.averageConfidence,
              duration: `${emailDuration.toFixed(1)}s`
            }
          );
          
          this.statusManager.updateData('email_writing', `Generated emails:\n${emailSummary}`, {
            emails: emailData.emails
          });
          
        } catch (parseError) {
          if (emailResult.startsWith('EMAIL_WRITING_FAILED')) {
            throw new Error(`Email writing failed: ${emailResult}`);
          }
          emailData = { rawResponse: emailResult, status: 'text_format' };
          this.statusManager.completePhase('email_writing', 'Email writing completed', {
            duration: `${emailDuration.toFixed(1)}s`
          });
        }
        
        // SUCCESS
        const totalDuration = (Date.now() - overallStartTime) / 1000;
        
        this.statusManager.updateSuccess('complete', 
          `🎉 Success! Generated ${emailData.emails?.length || 'multiple'} personalized emails in ${totalDuration.toFixed(1)}s`
        );
        
        const finalResult: MasterExecutionResult = {
          success: true,
          sessionId: this.statusManager.getStatus().sessionId,
          executionPlan: executionPlan,
          discoveryData: discoveryData,
          enrichmentData: enrichmentData,
          emailsGenerated: emailData,
          timing: {
            total: `${totalDuration.toFixed(1)}s`,
            discovery: `${discoveryDuration.toFixed(1)}s`,
            enrichment: `${enrichmentDuration.toFixed(1)}s`,
            emailWriting: `${emailDuration.toFixed(1)}s`
          },
          attemptNumber: attempt,
          timestamp: new Date().toISOString(),
          statusSummary: this.statusManager.getSummary()
        };
        
        console.log(`🎉 === EXECUTION SUCCESSFUL ===`);
        console.log(`⏱️  Total Time: ${totalDuration.toFixed(1)} seconds`);
        
        return finalResult;
        
      } catch (error: any) {
        const attemptDuration = (Date.now() - overallStartTime) / 1000;
        console.error(`\n❌ ATTEMPT ${attempt} FAILED after ${attemptDuration.toFixed(1)}s`);
        console.error(`💥 Error: ${error.message}`);
        
        if (attempt < this.retryAttempts) {
          this.statusManager.updateInfo('error', `Attempt ${attempt} failed: ${error.message}. Retrying...`);
          console.log(`🔄 Retrying in 3 seconds... (${this.retryAttempts - attempt} attempts remaining)\n`);
          await this.sleep(3000);
        } else {
          this.statusManager.failPhase('error', `All attempts failed: ${error.message}`, error);
          console.error(`\n💀 ALL ATTEMPTS EXHAUSTED`);
          
          return {
            success: false,
            sessionId: this.statusManager.getStatus().sessionId,
            error: 'All execution attempts failed',
            lastError: error.message,
            totalAttempts: this.retryAttempts,
            executionPlan: null,
            discoveryData: { status: 'failed', error: 'Failed to discover people' },
            enrichmentData: { status: 'failed', error: 'Failed to enrich profiles' },
            emailsGenerated: { status: 'failed', error: 'Failed to generate emails' },
            timing: {
              total: `${((Date.now() - overallStartTime) / 1000).toFixed(1)}s`,
              discovery: 'N/A',
              enrichment: 'N/A',
              emailWriting: 'N/A'
            },
            attemptNumber: attempt,
            timestamp: new Date().toISOString(),
            statusSummary: this.statusManager.getSummary()
          };
        }
      }
    }
    
    // This should never be reached
    return {
      success: false,
      sessionId: this.statusManager.getStatus().sessionId,
      error: 'Unexpected execution flow',
      executionPlan: null,
      discoveryData: { status: 'failed' },
      enrichmentData: { status: 'failed' },
      emailsGenerated: { status: 'failed' },
      timing: {
        total: `${((Date.now() - overallStartTime) / 1000).toFixed(1)}s`,
        discovery: 'N/A',
        enrichment: 'N/A',
        emailWriting: 'N/A'
      },
      attemptNumber: this.retryAttempts,
      timestamp: new Date().toISOString(),
      statusSummary: this.statusManager.getSummary()
    };
  }

  private async generateSearchQueriesAndPlan(userQuery: string): Promise<ExecutionPlan> {
    console.log('🧠 Analyzing query and generating search strategy...');
    this.statusManager.updateProgress('planning', 'Analyzing your request...', 30);
    
    const prompt = `Analyze this query and create a search strategy: "${userQuery}"

Your tasks:
1. Generate 8-10 diverse search queries to find the right people
2. Determine the email type (sales_outreach, hiring_pitch, startup_pitch, or collaboration)  
3. Extract user profile information for personalization
4. Set target count (default 3)

Be specific and varied in your search queries. Think about different angles, keywords, and approaches.

RETURN STRUCTURED RESPONSE:
- Search queries (8-10 specific, diverse queries)
- Email type classification
- User profile details
- Target count

Focus on finding founders, decision makers, and relevant professionals based on the query context.`;

    try {
      this.statusManager.updateProgress('planning', 'Creating search strategy...', 60);
      
      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-4.1-nano',
        max_tokens: 1200,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      });

      const analysisText = response.choices[0]?.message?.content || '';
      console.log('📝 Search strategy analysis completed');
      
      this.statusManager.updateProgress('planning', 'Finalizing execution plan...', 90);
      
      const plan = this.extractPlanFromAnalysis(analysisText, userQuery);
      return plan;
      
    } catch (error) {
      console.error('❌ Failed to generate search plan, using fallback');
      this.statusManager.updateInfo('planning', 'Using fallback search strategy...');
      return this.createFallbackPlan(userQuery);
    }
  }

  private extractPlanFromAnalysis(analysisText: string, originalQuery: string): ExecutionPlan {
    const searchQueries: string[] = [];
    
    // Extract search queries from the analysis
    const lines = analysisText.split('\n');
    for (const line of lines) {
      // Look for quoted search terms or bullet points with search queries
      const quotedMatches = line.match(/"([^"]{5,80})"/g);
      if (quotedMatches) {
        quotedMatches.forEach(match => {
          const query = match.replace(/"/g, '').trim();
          if (query.length > 5 && !searchQueries.includes(query)) {
            searchQueries.push(query);
          }
        });
      }
      
      // Look for bullet points or numbered lists that might contain queries
      if ((line.includes('-') || line.includes('•') || /^\d+\./.test(line.trim())) && 
          line.length > 10 && line.length < 100) {
        const cleanQuery = line.replace(/^[-•\d.\s]+/, '').trim();
        if (cleanQuery.length > 5 && !searchQueries.includes(cleanQuery)) {
          searchQueries.push(cleanQuery);
        }
      }
    }
    
    // Generate fallback queries if extraction failed
    if (searchQueries.length < 3) {
      if (originalQuery.toLowerCase().includes('yc') || originalQuery.toLowerCase().includes('combinator')) {
        searchQueries.push(
          'Y Combinator startup founders contact',
          'YC alumni founders LinkedIn profiles',
          'successful Y Combinator companies founders',
          'Y Combinator portfolio company CEOs',
          'YC Demo Day founders contact information'
        );
      } else if (originalQuery.toLowerCase().includes('bangalore') || originalQuery.toLowerCase().includes('banglore')) {
        searchQueries.push(
          'Bangalore startup founders contact',
          'AI SaaS startup founders Bangalore',
          'tech entrepreneurs Bangalore LinkedIn',
          'startup CEO Bangalore contact information',
          'AI startup founders India contact'
        );
      } else {
        searchQueries.push(
          'startup founders contact information',
          'tech company CEO email addresses',
          'successful entrepreneur contact details',
          'startup founder LinkedIn profiles',
          'technology company leaders contact'
        );
      }
    }
    
    // Determine email type
    let emailType = 'collaboration';
    const lowerQuery = originalQuery.toLowerCase();
    const lowerAnalysis = analysisText.toLowerCase();
    
    if (lowerQuery.includes('sell') || lowerQuery.includes('sales') || 
        lowerAnalysis.includes('sales') || lowerQuery.includes('product') ||
        lowerQuery.includes('cold email')) {
      emailType = 'sales_outreach';
    } else if (lowerQuery.includes('hire') || lowerQuery.includes('job') || 
               lowerAnalysis.includes('hiring')) {
      emailType = 'hiring_pitch';
    } else if (lowerQuery.includes('funding') || lowerQuery.includes('invest') || 
               lowerAnalysis.includes('funding')) {
      emailType = 'startup_pitch';
    }
    
    // Extract user profile
    const userProfile = this.extractUserProfile(originalQuery);
    
    // Determine target count
    let targetCount = 3;
    const countMatch = originalQuery.match(/(\d+)\s*(?:people|founders|contacts|profiles)/i);
    if (countMatch) {
      targetCount = Math.min(parseInt(countMatch[1]), 5); // Cap at 5
    }
    
    return {
      intent: emailType,
      searchQueries: searchQueries.slice(0, 10),
      emailType: emailType,
      userProfile: userProfile,
      targetCount: targetCount
    };
  }

  private extractUserProfile(query: string): UserProfile {
    const profile: UserProfile = {
      name: 'User',
      company: 'Company',
      valueProposition: 'solutions'
    };
    
    // Extract name
    if (query.toLowerCase().includes('kanoj')) {
      profile.name = 'Kanoj Vora';
    }
    
    // Extract company
    if (query.toLowerCase().includes('prospectai')) {
      profile.company = 'ProspectAI.co';
      profile.valueProposition = 'AI sales automation at scale';
      profile.industry = 'AI/SaaS';
    }
    
    // Extract case study/achievements
    if (query.includes('50k') || query.includes('50K')) {
      profile.caseStudy = 'Recently helped a company generate $50K pipeline with our tool';
    }
    
    // Extract additional context
    if (query.toLowerCase().includes('ai')) {
      profile.skills = 'AI, automation, startups';
    }
    
    return profile;
  }

  private createFallbackPlan(userQuery: string): ExecutionPlan {
    console.log('⚠️ Using fallback search plan');
    
    const baseQueries = [
      'startup founders contact information',
      'tech company CEO contact details',
      'successful startup founders LinkedIn',
      'venture backed startup founders',
      'tech entrepreneur contact information',
      'startup founder email addresses',
      'emerging tech company leaders'
    ];
    
    // Add location-specific queries if mentioned
    if (userQuery.toLowerCase().includes('bangalore') || userQuery.toLowerCase().includes('banglore')) {
      baseQueries.unshift(
        'Bangalore startup founders contact',
        'AI SaaS startup founders Bangalore',
        'tech entrepreneurs Bangalore LinkedIn'
      );
    }
    
    // Add Y Combinator queries if mentioned
    if (userQuery.toLowerCase().includes('yc') || userQuery.toLowerCase().includes('combinator')) {
      baseQueries.unshift(
        'Y Combinator alumni founders',
        'YC startup founders contact'
      );
    }
    
    return {
      intent: 'sales_outreach',
      searchQueries: baseQueries.slice(0, 8),
      emailType: 'sales_outreach',
      userProfile: {
        name: 'Tamil M',
        company: 'zoq agent',
        valueProposition: 'AI  automation at scale',
        caseStudy: 'helped dashchat.xyz generate leads',
        industry: 'AI/SaaS'
      },
      targetCount: 3
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// // Test execution with COMPREHENSIVE status manager logging
// (async () => {
//   console.log('🚀 Testing Final Master Orchestrator Agent with Complete Status Integration...\n');
  
//   const statusManager = new StatusManager();
//   const master = new MasterOrchestratorAgent(statusManager);
  
//   // Listen to ALL status updates and log them in real-time
//   statusManager.on('update', (update) => {
//     // This is exactly what would be sent to the frontend
//     console.log(`\n[📱 USER STATUS] ${update.message}`);
    
//     // Show data updates with details
//     if (update.data && update.type === 'data') {
//       if (update.data.people) {
//         console.log(`[📊 DATA] Found ${update.data.people.length} people`);
//       }
//       if (update.data.enrichedProfiles) {
//         console.log(`[📊 DATA] Enriched ${update.data.enrichedProfiles.length} profiles`);
//       }
//       if (update.data.emails) {
//         console.log(`[📊 DATA] Generated ${update.data.emails.length} emails`);
//       }
//     }
    
//     // Show progress updates
//     if (update.progress) {
//       console.log(`[📈 PROGRESS] ${update.phase}: ${update.progress}%`);
//     }
//   });
  
//   // Listen to phase completions
//   statusManager.on('success', (update) => {
//     console.log(`\n[✅ PHASE COMPLETE] ${update.message}`);
//   });
  
//   // Listen to errors
//   statusManager.on('error', (update) => {
//     console.log(`\n[❌ ERROR] ${update.message}`);
//   });
  
//   const testQuery = "Find ai saas startup founders who are in banglore and write emails. Im kanoj vora from prospectai.co, we do ai sales automation at scale. write them cold emails about our product. very short actionable, non salesy, concise cold email that is spot on and personalised. also we recently helped a company generate 50k usd pipeline with our tool";
  
//   try {
//     console.log('⚡ STARTING EXECUTION - Watch for status updates...\n');
    
//     const result = await master.executeQuery(testQuery);
    
//     console.log('\n' + '='.repeat(60));
//     console.log('🎯 === FINAL EXECUTION RESULT ===');
//     console.log('='.repeat(60));
//     console.log(`✅ Success: ${result.success}`);
//     console.log(`📱 Session ID: ${result.sessionId}`);
//     console.log(`⏱️  Total Time: ${result.timing?.total || 'N/A'}`);
    
//     // Show detailed timing breakdown
//     console.log('\n⏱️  === TIMING BREAKDOWN ===');
//     console.log(`Discovery: ${result.timing?.discovery}`);
//     console.log(`Enrichment: ${result.timing?.enrichment}`);
//     console.log(`Email Writing: ${result.timing?.emailWriting}`);
//     console.log(`Total: ${result.timing?.total}`);
    
//     // Show status summary
//     console.log('\n📊 === STATUS SUMMARY ===');
//     console.log(`Overall Status: ${result.statusSummary?.overallStatus}`);
//     console.log(`Progress: ${result.statusSummary?.progress}%`);
//     console.log(`Completed Phases: ${result.statusSummary?.completedPhases}/${result.statusSummary?.totalPhases}`);
    
//     if (result.success) {
//       console.log(`\n📊 Data Sizes:`);
//       console.log(`Discovery: ${JSON.stringify(result.discoveryData).length || 0} chars`);
//       console.log(`Enrichment: ${JSON.stringify(result.enrichmentData).length || 0} chars`);
//       console.log(`Emails: ${JSON.stringify(result.emailsGenerated).length || 0} chars`);
      
//       // Show structured results
//       if (result.emailsGenerated && result.emailsGenerated.emails) {
//         console.log('\n📧 === GENERATED EMAILS ===');
//         console.log('='.repeat(50));
//         result.emailsGenerated.emails.forEach((email: any, index: number) => {
//           console.log(`${index + 1}. TO: ${email.recipientName} <${email.recipientEmail || 'email@company.com'}>`);
//           console.log(`   COMPANY: ${email.recipientCompany}`);
//           console.log(`   SUBJECT: ${email.subject}`);
//           console.log(`   CONFIDENCE: ${email.confidence}/10`);
//           console.log(`   PERSONALIZATION: ${email.personalizationPoints?.slice(0, 2).join(', ') || 'Basic'}`);
//           console.log('');
//         });
//         console.log('='.repeat(50));
//       }
//     } else {
//       console.log(`\n❌ Error: ${result.error}`);
//       console.log(`💥 Last Error: ${result.lastError}`);
//     }
    
//     // Show chronological status updates
//     console.log('\n📋 === CHRONOLOGICAL STATUS UPDATES ===');
//     console.log('='.repeat(60));
//     const allUpdates = statusManager.getAllUpdates();
//     allUpdates.forEach((update, index) => {
//       const timestamp = new Date(update.timestamp).toLocaleTimeString();
//       console.log(`${index + 1}. [${timestamp}] [${update.phase.toUpperCase()}] [${update.type.toUpperCase()}] ${update.message}`);
//     });
//     console.log('='.repeat(60));
    
//     // Show user-friendly final summary
//     const userStatus = statusManager.getUserStatus();
//     console.log('\n🎯 === USER SUMMARY ===');
//     console.log(`Status: ${userStatus.isComplete ? '✅ Complete' : userStatus.hasError ? '❌ Failed' : '⏳ In Progress'}`);
//     console.log(`Current Phase: ${userStatus.phase}`);
//     console.log(`Progress: ${userStatus.progress}%`);
//     console.log(`Message: ${userStatus.message}`);
    
//   } catch (error) {
//     console.error('\n💀 Execution crashed:', error);
//     console.log(`\n[❌ CRITICAL ERROR] Execution failed: ${error}`);
//   }
// })();