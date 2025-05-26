// src/agents/enrichment-agent.ts - WITH STATUS MANAGER INTEGRATION
import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { brightDataMCP } from '../mcp/client';
import { StatusManager } from '../status/status-manager';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface EnrichedProfile {
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

interface EnrichmentResponse {
  enrichedProfiles: EnrichedProfile[];
  totalSearches: number;
  sourcesScraped: number;
  status: string;
  processingSteps: string[];
}

export class EnrichmentAgent extends EventEmitter {
  private openai: OpenAI;
  private retryAttempts: number = 2;
  private statusManager?: StatusManager;
  
  constructor(statusManager?: StatusManager) {
    super();
    this.statusManager = statusManager;
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
    });
  }

  async enrichPeopleWithEmailSignals(discoveryData: string): Promise<string> {
    // System logs for debugging
    console.log('🔍 Enrichment Agent: Starting batch enrichment + email signals collection...');
    
    // User-facing status updates
    this.statusManager?.updateInfo('enrichment', 'Enriching profiles with detailed information...');
    
    // Extract people from discovery data for logging
    const discoveredPeople = this.extractPeopleForLogging(discoveryData);
    if (discoveredPeople.length > 0) {
      console.log('👥 People to enrich:', discoveredPeople); // System log
      
      // Show people to enrich to user
      this.statusManager?.updateInfo('enrichment', `👥 Enriching ${discoveredPeople.length} profiles:`);
      discoveredPeople.forEach((person, index) => {
        this.statusManager?.updateInfo('enrichment', `   ${index + 1}. ${person.name} at ${person.company} - ${person.role}`);
      });
    }
    
    this.statusManager?.updateProgress('enrichment', 'Preparing enrichment tools...', 10);
    
    const availableTools = await brightDataMCP.listTools();
    const uniqueTools = availableTools.filter((tool, index, arr) => 
      arr.findIndex(t => t.name === tool.name) === index
    );
    
    const claudeTools = uniqueTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description || `Tool: ${tool.name}`,
        parameters: tool.inputSchema || {
          type: 'object',
          properties: {},
          required: []
        }
      }
    }));

    const prompt = `🎯 ENRICHMENT + EMAIL SIGNALS MISSION

DISCOVERY DATA:
${discoveryData}

🚨 CRITICAL: RETURN STRUCTURED JSON RESPONSE

Your job is to:
1. Extract ALL LinkedIn URLs and scrape profiles SIMULTANEOUSLY
2. Scrape ALL company websites for information using scrape_markdown tool to scrape the company urls
3. Search for recent company news, funding, product launches
4. Find specific pain points, challenges, opportunities
5. RETURN STRUCTURED JSON WITH EMAIL SIGNALS

EXECUTION STEPS:
1. LinkedIn profile scraping for all people
2. Company website scraping 
3. Recent news and activity research
4. Email signal compilation

RETURN FORMAT - EXACT JSON STRUCTURE:

{
  "enrichedProfiles": [
    {
      "name": "Full Name",
      "company": "Company Name",
      "role": "Job Title",
      "personalInfo": {
        "linkedinUrl": "https://linkedin.com/in/profile",
        "email": "person@company.com",
        "location": "City, Country",
        "education": "University details",
        "previousCompanies": ["Company1", "Company2"]
      },
      "companyInfo": {
        "companyUrl": "https://company.com",
        "fundingStage": "Series A",
        "fundingAmount": "$2M",
        "teamSize": 15,
        "foundedYear": 2020,
        "mainProduct": "Product description"
      },
      "keyInsights": [
        "Recently launched new product",
        "Expanding into new markets",
        "Hiring aggressively"
      ],
      "recentActivity": [
        "Posted about scaling challenges",
        "Attended TechCrunch Disrupt",
        "Announced partnership with BigCorp"
      ],
      "confidence": 8.5,
      "emailSignals": {
        "painPoints": ["Scaling customer acquisition", "Manual processes"],
        "opportunities": ["AI automation", "Process optimization"],
        "personalizedHooks": ["Recent product launch", "Buildspace submission"],
        "currentChallenges": ["Solo founder doing everything", "Need beta testers"]
      }
    }
  ],
  "totalSearches": 12,
  "sourcesScraped": 6,
  "status": "success",
  "processingSteps": ["LinkedIn scraping", "Company research", "News analysis"]
}

🚀 START ENRICHMENT AND RETURN JSON RESPONSE!`;

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        console.log(`🔄 Enrichment Attempt ${attempt + 1}/${this.retryAttempts}`); // System log
        
        if (attempt > 0) {
          this.statusManager?.updateInfo('enrichment', `Enrichment attempt ${attempt + 1}/${this.retryAttempts}...`);
        }
        
        this.statusManager?.updateProgress('enrichment', 'Starting deep profile analysis...', 20);
        
        const messages = [{ role: 'user' as const, content: prompt }];
        
        const response = await this.openai.chat.completions.create({
          model: 'openai/gpt-4.1-mini',
          max_tokens: 4000,
          temperature: 0.2,
          messages: messages,
          tools: claudeTools,
          tool_choice: 'auto'
        });

        const result = await this.handleEnrichment(messages, response, claudeTools);
        
        if (result && result.length > 300) {
          this.statusManager?.updateProgress('enrichment', 'Compiling enrichment insights...', 90);
          
          // Extract and log enriched profiles
          const enrichedProfiles = this.extractEnrichedProfilesForLogging(result);
          
          if (enrichedProfiles.length > 0) {
            console.log('📊 Enriched profile details:', enrichedProfiles); // System log
            
            // Show enriched insights to user
            this.statusManager?.updateSuccess('enrichment', `📊 Enhanced ${enrichedProfiles.length} profiles with actionable insights:`);
            
            enrichedProfiles.forEach((profile, index) => {
              const hook = profile.emailSignals?.personalizedHooks?.[0] || 'Professional insights found';
              this.statusManager?.updateData('enrichment', 
                `${index + 1}. Found insights: ${profile.name} is ${hook} at ${profile.company}`, 
                { profile, index }
              );
              
              if (profile.emailSignals?.painPoints?.length > 0) {
                this.statusManager?.updateInfo('enrichment', 
                  `      Pain points: ${profile.emailSignals.painPoints.slice(0, 2).join(', ')}`
                );
              }
              
              if (profile.personalInfo?.email) {
                this.statusManager?.updateInfo('enrichment', `      Contact: ${profile.personalInfo.email}`);
              }
            });
            
            // Show enrichment data for master agent
            this.statusManager?.updateData('enrichment', 'Enrichment data compiled', {
              enrichedProfiles: enrichedProfiles,
              count: enrichedProfiles.length,
              totalSearches: enrichedProfiles.length * 3, // Estimate
              sourcesScraped: enrichedProfiles.length * 2 // Estimate
            });
          }
          
          console.log(`✅ Enrichment Success! Generated ${result.length} characters with email signals`); // System log
          return result;
        } else {
          console.log(`⚠️ Attempt ${attempt + 1} - insufficient enrichment data`); // System log
          this.statusManager?.updateInfo('enrichment', `Attempt ${attempt + 1} - insufficient data, refining approach...`);
        }
        
        attempt++;
        
      } catch (error) {
        console.error(`❌ Enrichment attempt ${attempt + 1} failed:`, error); // System log
        this.statusManager?.updateInfo('enrichment', `Enrichment attempt ${attempt + 1} encountered issues...`);
        attempt++;
        
        if (attempt >= this.retryAttempts) {
          console.error('❌ All enrichment attempts failed'); // System log
          this.statusManager?.updateInfo('enrichment', '❌ Unable to enrich profiles after multiple attempts');
          
          const errorResponse: EnrichmentResponse = {
            enrichedProfiles: [],
            totalSearches: 0,
            sourcesScraped: 0,
            status: 'failed',
            processingSteps: ['Failed to start enrichment']
          };
          return JSON.stringify(errorResponse);
        }
        
        console.log(`🔄 Retrying enrichment in 3 seconds...`); // System log
        this.statusManager?.updateInfo('enrichment', 'Adjusting enrichment strategy and retrying...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    const failedResponse: EnrichmentResponse = {
      enrichedProfiles: [],
      totalSearches: 0,
      sourcesScraped: 0,
      status: 'failed',
      processingSteps: ['All attempts failed']
    };
    return JSON.stringify(failedResponse);
  }

  private extractPeopleForLogging(content: string): any[] {
    const people: any[] = [];
    
    try {
      // Use regex to find people data
      const nameRegex = /"name":\s*"([^"]+)"/g;
      const companyRegex = /"company":\s*"([^"]+)"/g;
      const roleRegex = /"role":\s*"([^"]+)"/g;
      
      let nameMatch, companyMatch, roleMatch;
      const names: string[] = [];
      const companies: string[] = [];
      const roles: string[] = [];
      
      while ((nameMatch = nameRegex.exec(content)) !== null) {
        names.push(nameMatch[1]);
      }
      while ((companyMatch = companyRegex.exec(content)) !== null) {
        companies.push(companyMatch[1]);
      }
      while ((roleMatch = roleRegex.exec(content)) !== null) {
        roles.push(roleMatch[1]);
      }
      
      // Combine the data
      for (let i = 0; i < Math.min(names.length, companies.length); i++) {
        people.push({
          name: names[i],
          company: companies[i],
          role: roles[i] || 'Role not specified'
        });
      }
    } catch (error) {
      console.log('⚠️ Could not extract people for logging, but continuing...'); // System log
    }
    
    return people;
  }

  private extractEnrichedProfilesForLogging(content: string): EnrichedProfile[] {
    const profiles: EnrichedProfile[] = [];
    
    try {
      // Use regex to find JSON structures
      const jsonRegex = /\{[\s\S]*?"enrichedProfiles"[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/g;
      const matches = content.match(jsonRegex);
      
      if (matches) {
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match);
            if (parsed.enrichedProfiles && Array.isArray(parsed.enrichedProfiles)) {
              profiles.push(...parsed.enrichedProfiles);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
      
      // Fallback: extract individual profile objects
      if (profiles.length === 0) {
        const profileRegex = /\{[^{}]*"name"[^{}]*"emailSignals"[^{}]*\}/g;
        const profileMatches = content.match(profileRegex);
        
        if (profileMatches) {
          for (const match of profileMatches) {
            try {
              const profile = JSON.parse(match);
              if (profile.name) {
                profiles.push(profile);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not extract enriched profiles for logging, but continuing...'); // System log
    }
    
    return profiles;
  }

  private async handleEnrichment(
    messages: any[], 
    response: any, 
    tools: any[],
    round: number = 0
  ): Promise<string> {
    
    const MAX_ROUNDS = 2;
    const assistantMessage = response.choices[0]?.message;
    
    if (!assistantMessage) {
      throw new Error('No assistant message received');
    }

    messages.push({
      role: 'assistant',
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls
    });

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && round < MAX_ROUNDS) {
      console.log(`🔧 [Round ${round + 1}/${MAX_ROUNDS}] Executing ${assistantMessage.tool_calls.length} enrichment tools...`); // System log
      
      // Update user about tool execution
      this.statusManager?.updateProgress('enrichment', 
        `🔧 Round ${round + 1}: Executing ${assistantMessage.tool_calls.length} enrichment tools...`, 
        30 + (round * 30)
      );
      
      // Log tool usage
      const toolUsage: { [key: string]: number } = {};
      assistantMessage.tool_calls.forEach((toolCall: any) => {
        const toolName = toolCall.function.name;
        toolUsage[toolName] = (toolUsage[toolName] || 0) + 1;
        
        // Show specific actions to user
        if (toolName === 'web_data_linkedin_person_profile') {
          this.statusManager?.updateInfo('enrichment', '👤 Scraping LinkedIn profiles...');
        } else if (toolName === 'web_data_linkedin_company_profile') {
          this.statusManager?.updateInfo('enrichment', '🏢 Researching company LinkedIn pages...');
        } else if (toolName === 'search_engine') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            this.statusManager?.updateInfo('enrichment', `🔍 Searching for: ${args.query}`);
          } catch (e) {
            this.statusManager?.updateInfo('enrichment', '🔍 Performing targeted web searches...');
          }
        } else if (toolName === 'scrape_as_markdown') {
          this.statusManager?.updateInfo('enrichment', '🌐 Scraping company websites...');
        }
      });
      
      // Show tool usage summary to user
      const toolSummary = Object.entries(toolUsage).map(([tool, count]) => {
        const friendlyName = tool.replace('web_data_', '').replace('_', ' ');
        return `${friendlyName}: ${count}`;
      }).join(', ');
      
      this.statusManager?.updateInfo('enrichment', `🛠️ Tool usage: ${toolSummary}`);
      
      // System log
      console.log('🛠️ Tool usage in this round:');
      Object.entries(toolUsage).forEach(([tool, count]) => {
        console.log(`   ${tool}: ${count} calls`);
      });
      
      const toolPromises = assistantMessage.tool_calls.map(async (toolCall: any, index: number) => {
        const toolName = toolCall.function.name;
        
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const startTime = Date.now();
          
          const toolPromise = brightDataMCP.callTool(toolName, args);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${toolName} timeout`)), 30000)
          );
          
          const result = await Promise.race([toolPromise, timeoutPromise]);
          const duration = Date.now() - startTime;
          
          console.log(`✅ [${index + 1}] ${toolName} completed in ${duration}ms`); // System log
          
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          };
        } catch (error: any) {
          console.error(`❌ [${index + 1}] ${toolName} failed:`, error.message); // System log
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: `Error: ${error.message}`
          };
        }
      });

      const toolResults = await Promise.all(toolPromises);
      messages.push(...toolResults);

      const forceCompilation = round >= 0;
      
      if (forceCompilation) {
        console.log('🧠 Analyzing and compiling enrichment data...'); // System log
        this.statusManager?.updateProgress('enrichment', '🧠 Analyzing and compiling enrichment data...', 80);
        
        messages.push({
          role: 'user',
          content: `🚨 COMPILE ENRICHED PROFILES WITH EMAIL SIGNALS NOW!

Use all the data you've collected to create structured JSON response.

CRITICAL: Return ONLY valid JSON in this exact format:

{
  "enrichedProfiles": [
    {
      "name": "Full Name",
      "company": "Company Name",
      "role": "Job Title",
      "personalInfo": {
        "linkedinUrl": "https://linkedin.com/in/profile",
        "email": "person@company.com",
        "location": "City, Country",
        "education": "University details",
        "previousCompanies": ["Company1", "Company2"]
      },
      "companyInfo": {
        "companyUrl": "https://company.com",
        "fundingStage": "Series A",
        "fundingAmount": "$2M", 
        "teamSize": 15,
        "foundedYear": 2020,
        "mainProduct": "Product description"
      },
      "keyInsights": ["insight1", "insight2", "insight3"],
      "recentActivity": ["activity1", "activity2"],
      "confidence": 8.5,
      "emailSignals": {
        "painPoints": ["pain1", "pain2"],
        "opportunities": ["opp1", "opp2"],
        "personalizedHooks": ["hook1", "hook2"],
        "currentChallenges": ["challenge1", "challenge2"]
      }
    }
  ],
  "totalSearches": 12,
  "sourcesScraped": 6,
  "status": "success",
  "processingSteps": ["LinkedIn scraping", "Company research", "News analysis"]
}

Return ONLY the JSON response, no additional text.`
        });
      }

      const continueResponse = await this.openai.chat.completions.create({
        model: 'openai/gpt-4.1-mini',
        max_tokens: 4000,
        temperature: 0.3,
        messages: messages,
        tools: forceCompilation ? [] : tools,
        tool_choice: forceCompilation ? 'none' : 'auto'
      });

      const continueMessage = continueResponse.choices[0]?.message;
      
      if (continueMessage?.tool_calls && continueMessage.tool_calls.length > 0 && !forceCompilation) {
        console.log(`🔄 Continuing to enrichment round ${round + 2}...`); // System log
        this.statusManager?.updateProgress('enrichment', `Continuing to round ${round + 2} for deeper insights...`, 60);
        return await this.handleEnrichment(messages, continueResponse, tools, round + 1);
      }

      const finalContent = continueMessage?.content || '';
      console.log(`📊 Enrichment compiled: ${finalContent.length} characters with email signals`); // System log
      return finalContent;
    }

    const content = assistantMessage.content || '';
    console.log(`📊 Final enrichment content: ${content.length} characters`); // System log
    return content;
  }
}

// // Test execution with status manager
// (async () => {
//   console.log('🚀 Testing Enrichment Agent with Status Manager...\n');
  
//   const statusManager = new StatusManager();
//   const enrichmentAgent = new EnrichmentAgent(statusManager);
  
//   // Listen to status updates
//   statusManager.on('update', (update: any) => {
//     // This is what would be sent to the frontend
//     console.log(`[USER UPDATE] ${update.message}`);
//     if (update.data?.enrichedProfiles) {
//       console.log(`[DATA] Enhanced ${update.data.enrichedProfiles.length} profiles`);
//     }
//   });
  
//   // Mock discovery data
//   const mockDiscoveryData = JSON.stringify({
//     people: [
//       {
//         name: "Anuj Bishnoi",
//         company: "RePut.ai",
//         role: "Co-founder",
//         linkedinUrl: "https://linkedin.com/in/anuj-bishnoi",
//         companyUrl: "https://reput.ai",
//         confidence: 8.5
//       },
//       {
//         name: "Shiva Dhawan", 
//         company: "attentive AI",
//         role: "CEO",
//         linkedinUrl: "https://linkedin.com/in/shivadw",
//         companyUrl: "https://attentive.ai",
//         confidence: 9.0
//       }
//     ],
//     searchQueries: ["AI startup founders Bangalore"],
//     totalSearches: 3,
//     status: "success"
//   });
  
//   try {
//     statusManager.startPhase('enrichment', 'Starting profile enrichment phase...');
    
//     const result = await enrichmentAgent.enrichPeopleWithEmailSignals(mockDiscoveryData);
    
//     console.log('\n🎯 === ENRICHMENT RESULT ===');
//     console.log(`Result Length: ${result.length} characters`);
    
//     // Parse and show structured result
//     try {
//       const parsed = JSON.parse(result);
//       console.log(`Status: ${parsed.status}`);
//       console.log(`Profiles Enriched: ${parsed.enrichedProfiles?.length || 0}`);
      
//       if (parsed.enrichedProfiles && parsed.enrichedProfiles.length > 0) {
//         console.log('\n👥 ENRICHED PROFILES:');
//         parsed.enrichedProfiles.forEach((profile: any, index: number) => {
//           console.log(`${index + 1}. ${profile.name} at ${profile.company}`);
//           console.log(`   Role: ${profile.role}`);
//           console.log(`   Email: ${profile.personalInfo?.email || 'Not found'}`);
//           console.log(`   Pain Points: ${profile.emailSignals?.painPoints?.join(', ') || 'None identified'}`);
//           console.log(`   Hooks: ${profile.emailSignals?.personalizedHooks?.join(', ') || 'None found'}`);
//           console.log(`   Confidence: ${profile.confidence}/10`);
//           console.log('');
//         });
//       }
//     } catch (e) {
//       console.log('Result is not JSON format, showing raw content:');
//       console.log(result.substring(0, 500) + '...');
//     }
    
//     statusManager.completePhase('enrichment', 'Enrichment phase completed successfully!');
    
//     // Show all status updates
//     console.log('\n📋 === ALL STATUS UPDATES ===');
//     const allUpdates = statusManager.getAllUpdates();
//     allUpdates.forEach((update: any, index: number) => {
//       console.log(`${index + 1}. [${update.type.toUpperCase()}] ${update.message}`);
//     });
    
//   } catch (error) {
//     console.error('💀 Enrichment test failed:', error);
//     statusManager.failPhase('enrichment', `Enrichment failed: ${error}`);
//   }
// })();