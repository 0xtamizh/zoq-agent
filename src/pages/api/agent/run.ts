// src/pages/api/agent/run.ts - FIXED TO CAPTURE EMAIL DATA FROM STATUS UPDATES
import { MasterOrchestratorAgent } from '@/lib/agent/master-orchestrator-agent';
import { StatusManager } from '@/lib/status/status-manager';
import type { NextApiRequest, NextApiResponse } from 'next';

// Add debug logging at the top level
console.log('🔧 API Route loaded at:', new Date().toISOString());

// Type mapping: StatusManager -> Frontend
interface FrontendUpdate {
  type: 'status-update' | 'final-result' | 'error';
  phase?: 'planning' | 'discovery' | 'research' | 'generation' | 'complete' | 'error';
  message?: string;
  progress?: number;
  thinking?: string;
  data?: any;
  result?: any;
}

// Helper function to send SSE data
function sendSSEData(res: NextApiResponse, data: FrontendUpdate) {
  if (res.writable) {
    const jsonData = JSON.stringify(data);
    console.log('📡 SSE: Sending data:', jsonData);
    res.write(`event: message\ndata: ${jsonData}\n\n`);
  }
}

// Helper function to end SSE stream
function endSSEStream(res: NextApiResponse) {
  if (res.writable) {
    console.log('🏁 SSE: Ending stream');
    res.write(`event: done\ndata: [DONE]\n\n`);
    res.end();
  }
}

// Enhanced function to transform captured data to frontend prospects
function transformCapturedDataToProspects(capturedData: any): any[] {
  console.log('🔄 API: Transforming captured data to prospects...');
  console.log('📦 API: Captured data:', capturedData);
  
  const prospects: any[] = [];
  
  try {
    // Extract emails from captured data
    const emailData = capturedData.emails || [];
    const discoveryData = capturedData.discovery || [];
    const enrichmentData = capturedData.enrichment || [];
    
    console.log('📊 API: Found data:', {
      emails: emailData.length,
      discovery: discoveryData.length,
      enrichment: enrichmentData.length
    });
    
    // Transform emails to prospects
    if (Array.isArray(emailData) && emailData.length > 0) {
      emailData.forEach((email: any, index: number) => {
        // Get corresponding person from discovery
        const discoveryPerson = discoveryData[index] || {};
        
        // Get corresponding enriched profile
        const enrichedProfile = enrichmentData[index] || {};
        
        // Create comprehensive prospect object
        const prospect = {
          id: `prospect_${index + 1}`,
          name: email.recipientName || discoveryPerson.name || `Person ${index + 1}`,
          company: email.recipientCompany || discoveryPerson.company || 'Unknown Company',
          role: discoveryPerson.role || enrichedProfile.role || 'Professional',
          location: discoveryPerson.location || enrichedProfile.personalInfo?.location || '',
          email: email.recipientEmail || discoveryPerson.email || enrichedProfile.personalInfo?.email || '',
          
          // URLs
          linkedInUrl: discoveryPerson.linkedinUrl || enrichedProfile.personalInfo?.linkedinUrl || null,
          companyUrl: discoveryPerson.companyUrl || enrichedProfile.companyInfo?.companyUrl || null,
          imageUrl: discoveryPerson.imageUrl || null,
          
          // Email message (MAIN DATA)
          message: {
            subject: email.subject || 'No subject available',
            body: email.body || 'No message available',
            personalization: email.personalizationPoints || [],
            confidence: email.confidence || 0,
            wordCount: email.wordCount || 0,
            emailType: email.emailType || 'unknown'
          },
          
          // Research insights
          research: {
            insights: [
              ...(enrichedProfile.keyInsights || []),
              ...(enrichedProfile.emailSignals?.personalizedHooks || []),
              ...(enrichedProfile.emailSignals?.currentChallenges || [])
            ].filter(Boolean),
            painPoints: enrichedProfile.emailSignals?.painPoints || [],
            opportunities: enrichedProfile.emailSignals?.opportunities || [],
            companyInfo: enrichedProfile.companyInfo || {},
            fundingStage: enrichedProfile.companyInfo?.fundingStage || '',
            teamSize: enrichedProfile.companyInfo?.teamSize || 0
          },
          
          // Additional metadata
          confidence: email.confidence || enrichedProfile.confidence || 0,
          emailType: email.emailType || 'unknown',
          wordCount: email.wordCount || 0,
          generatedAt: new Date().toISOString()
        };
        
        prospects.push(prospect);
        console.log(`✅ API: Created prospect ${index + 1}:`, {
          name: prospect.name,
          company: prospect.company,
          hasEmail: !!prospect.message.body,
          hasSubject: !!prospect.message.subject,
          personalizationCount: prospect.message.personalization.length,
          insightsCount: prospect.research.insights.length,
          confidence: prospect.confidence
        });
      });
    }
    
    console.log(`🎯 API: Successfully transformed ${prospects.length} prospects`);
    
  } catch (parseError) {
    console.error('❌ API: Error transforming prospects:', parseError);
  }
  
  return prospects;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add comprehensive logging
  console.log('🚀 API Handler called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✈️ Handling OPTIONS preflight request');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');
    res.status(200).end();
    return;
  }

  // Check method
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate request body
  console.log('📦 Request body:', req.body);
  if (!req.body) {
    console.log('❌ No request body found');
    return res.status(400).json({ error: 'Request body is required' });
  }

  const { query, criteria, productInfo } = req.body;
  if (!query) {
    console.log('❌ No query in request body');
    return res.status(400).json({ error: 'Query is required' });
  }
  
  console.log('🟢 Request validation passed');
  console.log('💬 Query:', query);
  console.log('📊 Criteria:', criteria);
  console.log('📃 Product Info:', productInfo);

  // Set SSE headers for real-time streaming
  console.log('🔧 Setting SSE headers');
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
    'X-Accel-Buffering': 'no'
  });

  // Send a comment to establish the connection
  res.write(':connection established\n\n');
  console.log('🔗 SSE connection established');

  // Send initial connection confirmation
  try {
    sendSSEData(res, {
      type: 'status-update',
      phase: 'planning',
      message: 'Starting agent process...',
      progress: 0,
      thinking: 'Initializing systems'
    });
    console.log('✅ Initial SSE message sent');
  } catch (error) {
    console.error('❌ Error sending initial SSE message:', error);
  }

  let responseSent = false;
  
  // ⭐ NEW: Data capture object to store data from status updates
  const capturedData: any = {
    emails: [],
    discovery: [],
    enrichment: []
  };
  
  // Handle client disconnect
  const handleDisconnect = () => {
    console.log('🔌 SSE: Client disconnected');
    responseSent = true;
  };

  req.on('close', handleDisconnect);
  req.on('end', handleDisconnect);
  
  try {
    console.log('🚀 API: Starting MasterOrchestratorAgent...');
    
    // Create StatusManager and Master Agent
    const statusManager = new StatusManager();
    const masterAgent = new MasterOrchestratorAgent(statusManager);
    
    // Map StatusManager phases to Frontend phases
    const phaseMapping: { [key: string]: string } = {
      'planning': 'planning',
      'discovery': 'discovery', 
      'enrichment': 'research',
      'email_writing': 'generation',
      'complete': 'complete',
      'error': 'error'
    };
    
    // ⭐ ENHANCED: Forward StatusManager updates to Frontend via SSE AND capture data
    statusManager.on('update', (statusUpdate) => {
      console.log('📢 StatusManager update:', statusUpdate);
      
      // ⭐ NEW: Capture data from status updates
      if (statusUpdate.data) {
        if (statusUpdate.phase === 'discovery' && statusUpdate.data.people) {
          console.log('📥 API: Capturing discovery data:', statusUpdate.data.people.length, 'people');
          capturedData.discovery = statusUpdate.data.people;
        }
        
        if (statusUpdate.phase === 'enrichment' && statusUpdate.data.enrichedProfiles) {
          console.log('📥 API: Capturing enrichment data:', statusUpdate.data.enrichedProfiles.length, 'profiles');
          capturedData.enrichment = statusUpdate.data.enrichedProfiles;
        }
        
        if (statusUpdate.phase === 'email_writing' && statusUpdate.data.emails) {
          console.log('📥 API: Capturing email data:', statusUpdate.data.emails.length, 'emails');
          capturedData.emails = statusUpdate.data.emails;
        }
      }
      
      if (!responseSent) {
        const frontendUpdate: FrontendUpdate = {
          type: 'status-update',
          phase: phaseMapping[statusUpdate.phase] as any || statusUpdate.phase as any,
          message: statusUpdate.message,
          progress: statusUpdate.progress,
          thinking: statusUpdate.message, // Use message as thinking text
          data: statusUpdate.data
        };
        
        try {
          sendSSEData(res, frontendUpdate);
        } catch (error) {
          console.error('❌ Error sending SSE update:', error);
        }
      }
    });
    
    // Execute the master agent with your query
    console.log('🎯 API: Executing master agent query...');
    const masterResult = await masterAgent.executeQuery(query);
    
    console.log('✅ API: Master agent completed:', masterResult.success);
    
    // Check if client is still connected before sending result
    if (responseSent) {
      console.log('🔌 SSE: Client disconnected before completion');
      return;
    }
    
    // ⭐ NEW: Use captured data instead of masterResult for transformation
    console.log('🔄 API: Using captured data for transformation');
    console.log('📦 API: Captured data summary:', {
      emails: capturedData.emails.length,
      discovery: capturedData.discovery.length,
      enrichment: capturedData.enrichment.length
    });
    
    const prospects = transformCapturedDataToProspects(capturedData);
    
    // Create enhanced frontend result
    let frontendResult: any = {
      success: masterResult.success,
      prospects: prospects,
      timing: masterResult.timing,
      sessionId: masterResult.sessionId,
      totalProspects: prospects.length,
      averageConfidence: prospects.length > 0 
        ? prospects.reduce((sum, p) => sum + (p.confidence || 0), 0) / prospects.length
        : 0,
      metadata: {
        executionPlan: masterResult.executionPlan,
        attemptNumber: masterResult.attemptNumber,
        timestamp: masterResult.timestamp,
        capturedDataSummary: {
          emails: capturedData.emails.length,
          discovery: capturedData.discovery.length,
          enrichment: capturedData.enrichment.length
        }
      }
    };
    
    console.log('📊 API: Frontend result prepared:', {
      success: frontendResult.success,
      prospectCount: frontendResult.prospects.length,
      averageConfidence: frontendResult.averageConfidence,
      timing: frontendResult.timing
    });
    
    // Send final result
    if (!responseSent) {
      const finalUpdate: FrontendUpdate = {
        type: 'final-result',
        result: frontendResult
      };
      
      try {
        sendSSEData(res, finalUpdate);
        responseSent = true;
        console.log('✅ Enhanced final result sent with', prospects.length, 'prospects');
        
        // End the stream properly
        setTimeout(() => {
          endSSEStream(res);
        }, 100);
      } catch (error) {
        console.error('❌ Error sending final result:', error);
      }
    }
    
  } catch (error: any) {
    console.error('💥 API: Error occurred:', error);
    console.error('💥 Stack trace:', error.stack);
    
    if (!responseSent) {
      const errorUpdate: FrontendUpdate = {
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      };
      
      try {
        sendSSEData(res, errorUpdate);
        responseSent = true;
        
        // End the stream after error
        setTimeout(() => {
          endSSEStream(res);
        }, 100);
      } catch (sseError) {
        console.error('❌ Error sending SSE error message:', sseError);
        // Fallback to regular JSON response
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      }
    }
  } finally {
    // Cleanup listeners
    req.off('close', handleDisconnect);
    req.off('end', handleDisconnect);
    console.log('🧹 Cleanup completed');
  }
}

// Export config for API route
export const config = {
  api: {
    responseLimit: false, // Disable response limit for SSE
    externalResolver: true, // Handle response manually
  },
};