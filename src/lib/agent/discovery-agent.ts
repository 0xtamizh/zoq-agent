// src/agents/discovery-agent.ts - WITH STATUS MANAGER INTEGRATION
import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { brightDataMCP } from '../mcp/client';
import { StatusManager } from '../status/status-manager';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface PeopleCard {
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

interface DiscoveryResponse {
  people: PeopleCard[];
  searchQueries: string[];
  totalSearches: number;
  status: string;
  error?: string;
}

export class DiscoveryAgent extends EventEmitter {
  private openai: OpenAI;
  private maxPeople: number = 3;
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

  async findBasicPeople(searchQueries: string[], request: any): Promise<string> {
    // System logs for debugging
    console.log(`🔍 Discovery Agent: Finding people with ${searchQueries.length} search queries...`);
    
    // User-facing status updates
    this.statusManager?.updateInfo('discovery', 'Finding founders who match your criteria...');
    
    // Show search queries to user
    this.statusManager?.updateProgress('discovery', 'Preparing search strategies...', 5);
    this.statusManager?.updateInfo('discovery', `Executing ${searchQueries.length} targeted searches:`);
    
    // Show first few queries to user
    const displayQueries = searchQueries.slice(0, 3);
    displayQueries.forEach((query, index) => {
      this.statusManager?.updateInfo('discovery', `• ${query}`);
    });
    
    if (searchQueries.length > 3) {
      this.statusManager?.updateInfo('discovery', `• ... and ${searchQueries.length - 3} more searches`);
    }
    
    console.log(`📋 Search Queries:`, searchQueries); // System log
    
    const availableTools = await brightDataMCP.listTools();
    const searchTool = availableTools.find(tool => tool.name === 'search_engine');
    
    if (!searchTool) {
      this.statusManager?.updateInfo('discovery', '❌ Search tools not available');
      throw new Error('Search engine tool not available');
    }
    
    const claudeTools = [{
      type: 'function' as const,
      function: {
        name: 'search_engine',
        description: searchTool.description || 'Search the web',
        parameters: searchTool.inputSchema || {
          type: 'object',
          properties: {
            query: { type: 'string' },
            engine: { type: 'string', default: 'google' }
          },
          required: ['query']
        }
      }
    }];

    const prompt = `🎯 DISCOVERY MISSION: Find ${this.maxPeople} people matching "${JSON.stringify(request)}"

SEARCH QUERIES TO EXECUTE: ${JSON.stringify(searchQueries)} - all in parallel , NO SERIAL EXECUTION

🚨 CRITICAL: RETURN STRUCTURED JSON RESPONSE

Execute all search queries and return results in this EXACT JSON format:

{
  "people": [
    {
      "name": "Full Name",
      "company": "Company Name",
      "role": "Job Title",
      "linkedinUrl": "https://linkedin.com/in/profile",
      "companyUrl": "https://company.com",
      "email": null,
      "location": "City, Country",
      "confidence": 8.5,
      "summary": "Brief description from search results"
    }
  ],
  "searchQueries": ${JSON.stringify(searchQueries)},
  "totalSearches": ${searchQueries.length},
  "status": "success"
}

⚡ EXECUTION RULES:
1. Execute ALL ${searchQueries.length} search queries using search_engine tool in parralel
2. Extract basic people information from search results
3. Focus on finding: name, company, role, LinkedIn URL, company website
4. NO LinkedIn scraping - just collect the URLs
5. Return ${this.maxPeople} best matches
6. MUST return valid JSON format

🎯 FIND THESE DETAILS FOR EACH PERSON:
- Full name (required)
- Company name (required)
- Job role/title (required)
- LinkedIn profile URL (must have)
- Company website URL (if available)
- Location (if available)
- Basic summary from search results
- Confidence score (1-10 based on data quality)

Make sure to use the tool in parallel for fast results
🚀 START SEARCHING AND RETURN JSON RESPONSE!`;

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        console.log(`🔄 Discovery Attempt ${attempt + 1}/${this.retryAttempts}`); // System log
        
        this.statusManager?.updateProgress('discovery', 'Pondering on the task...', 15);
        
        const messages = [{ role: 'user' as const, content: prompt }];
        
        const response = await this.openai.chat.completions.create({
          model: 'openai/gpt-4.1-mini',
          max_tokens: 3000,
          temperature: 0.1,
          messages: messages,
          tools: claudeTools,
          tool_choice: 'auto'
        });

        const result = await this.handleSearchAndReturn(messages, response, claudeTools);
        
        if (result && result.length > 100) {
          this.statusManager?.updateProgress('discovery', 'Processing all the search results...', 80);
          
          // Extract and log people cards using regex (no parsing to avoid errors)
          const peopleCards = this.extractPeopleCardsForLogging(result);
          
          if (peopleCards.length > 0) {
            this.statusManager?.updateSuccess('discovery', `🎉 Hurray! Found ${peopleCards.length} people:`);
            
            // Show found people to user
            peopleCards.forEach((person, index) => {
              const summary = person.summary || 'Professional profile found';
              this.statusManager?.updateData('discovery', 
                `${index + 1}. ${person.name}, ${person.company}, ${summary}`, 
                { person, index }
              );
            });
            
            // Show people data for master agent
            this.statusManager?.updateData('discovery', 'Found people data', {
              people: peopleCards,
              count: peopleCards.length,
              searchQueries: searchQueries
            });
          }
          
          console.log(`✅ Discovery Success! Found data (${result.length} chars)`); // System log
          return result;
        }
        
        console.log(`⚠️ Discovery attempt ${attempt + 1} - insufficient data found`); // System log
        this.statusManager?.updateInfo('discovery', `Attempt ${attempt + 1} - refining search approach...`);
        attempt++;
        
      } catch (error) {
        console.error(`❌ Discovery attempt ${attempt + 1} failed:`, error); // System log
        this.statusManager?.updateInfo('discovery', `Search attempt ${attempt + 1} encountered issues, retrying...`);
        attempt++;
        
        if (attempt >= this.retryAttempts) {
          console.error('❌ All discovery attempts failed'); // System log
          this.statusManager?.updateInfo('discovery', '❌ Unable to find matching founders after multiple attempts');
          
          const errorResponse: DiscoveryResponse = {
            people: [],
            searchQueries: searchQueries,
            totalSearches: searchQueries.length,
            status: 'failed',
            error: `Unable to find people data after ${this.retryAttempts} attempts. Error: ${error}`
          };
          return JSON.stringify(errorResponse);
        }
        
        console.log(`🔄 Retrying discovery in 2 seconds...`); // System log
        this.statusManager?.updateInfo('discovery', 'Adjusting search strategy and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const failedResponse: DiscoveryResponse = {
      people: [],
      searchQueries: searchQueries,
      totalSearches: searchQueries.length,
      status: 'failed',
      error: 'No attempts succeeded'
    };
    return JSON.stringify(failedResponse);
  }

  private extractPeopleCardsForLogging(content: string): PeopleCard[] {
    const cards: PeopleCard[] = [];
    
    try {
      // Use regex to find JSON-like structures
      const jsonRegex = /\{[\s\S]*?"people"[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/g;
      const matches = content.match(jsonRegex);
      
      if (matches) {
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match);
            if (parsed.people && Array.isArray(parsed.people)) {
              cards.push(...parsed.people);
            }
          } catch (e) {
            // Ignore parsing errors, continue with next match
          }
        }
      }
      
      // Fallback: extract individual person objects
      if (cards.length === 0) {
        const personRegex = /\{[^{}]*"name"[^{}]*"company"[^{}]*\}/g;
        const personMatches = content.match(personRegex);
        
        if (personMatches) {
          for (const match of personMatches) {
            try {
              const person = JSON.parse(match);
              if (person.name && person.company) {
                cards.push(person);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not extract people cards for logging, but continuing...'); // System log
    }
    
    return cards;
  }

  private async handleSearchAndReturn(
    messages: any[], 
    response: any, 
    tools: any[]
  ): Promise<string> {
    
    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error('No assistant message received');
    }

    messages.push({
      role: 'assistant',
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls
    });

    // Execute search tools if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🔧 Executing ${assistantMessage.tool_calls.length} search queries IN PARALLEL...`); // System log
      
      this.statusManager?.updateProgress('discovery', 
        `Searching across ${assistantMessage.tool_calls.length} sources simultaneously...`, 
        30
      );
      
      const toolPromises = assistantMessage.tool_calls.map(async (toolCall: any, index: number) => {
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`🔍 [${index + 1}] Searching: ${args.query}`); // System log
        
        // Show search progress to user
        this.statusManager?.updateProgress('discovery', 
          `🔍 Searching: ${args.query}`, 
          30 + (index * 5)
        );
        
        try {
          const startTime = Date.now();
          
          const result = await brightDataMCP.callTool('search_engine', args);
          const duration = Date.now() - startTime;
          
          console.log(`✅ [${index + 1}] Search completed in ${duration}ms`); // System log
          
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          };
        } catch (error: any) {
          console.error(`❌ [${index + 1}] Search failed:`, error.message); // System log
          return {
            role: 'tool' as const,
            tool_call_id: toolCall.id,
            content: `Search Error: ${error.message}`
          };
        }
      });

      const toolResults = await Promise.all(toolPromises);
      messages.push(...toolResults);

      this.statusManager?.updateProgress('discovery', 'Analyzing search results...', 70);

      // Get final compilation of results with JSON format enforcement
      messages.push({
        role: 'user',
        content: `Now compile all the search results and extract the best ${this.maxPeople} people. 

CRITICAL: Return ONLY valid JSON in this exact format:

{
  "people": [
    {
      "name": "Full Name",
      "company": "Company Name", 
      "role": "Job Title",
      "linkedinUrl": "https://linkedin.com/in/profile",
      "companyUrl": "https://company.com",
      "email": null,
      "location": "City, Country",
      "confidence": 8.5,
      "summary": "Brief description"
    }
  ],
  "searchQueries": ["query1", "query2"],
  "totalSearches": 8,
  "status": "success"
}

Return ONLY the JSON response, no additional text.`
      });

      const finalResponse = await this.openai.chat.completions.create({
        model: 'openai/gpt-4.1-mini',
        max_tokens: 3000,
        temperature: 0.1,
        messages: messages
      });

      const finalContent = finalResponse.choices[0]?.message?.content || '';
      console.log(`📋 Discovery compiled ${finalContent.length} characters of people data`); // System log
      
      return finalContent;
    }

    // No tool calls, return direct content
    const content = assistantMessage.content || '';
    console.log(`📋 Discovery found ${content.length} characters of people data`); // System log
    
    return content;
  }
}

// // Test execution with status manager
// (async () => {
//   console.log('🚀 Testing Discovery Agent with Status Manager...\n');
  
//   const statusManager = new StatusManager();
//   const discoveryAgent = new DiscoveryAgent(statusManager);
  
//   // Listen to status updates
//   statusManager.on('update', (update: any) => {
//     // This is what would be sent to the frontend
//     console.log(`[USER UPDATE] ${update.message}`);
//     if (update.data?.people) {
//       console.log(`[DATA] Found ${update.data.people.length} people`);
//     }
//   });
  
//   const testQueries = [
//     'Bangalore AI SaaS startup founders',
//     'AI startup CEOs Bangalore', 
//     'Bangalore tech entrepreneurs LinkedIn'
//   ];
  
//   const testRequest = {
//     query: "Find AI SaaS startup founders in Bangalore",
//     targetCount: 3
//   };
  
//   try {
//     statusManager.startPhase('discovery', 'Starting people discovery phase...');
    
//     const result = await discoveryAgent.findBasicPeople(testQueries, testRequest);
    
//     console.log('\n🎯 === DISCOVERY RESULT ===');
//     console.log(`Result Length: ${result.length} characters`);
    
//     // Parse and show structured result
//     try {
//       const parsed = JSON.parse(result);
//       console.log(`Status: ${parsed.status}`);
//       console.log(`People Found: ${parsed.people?.length || 0}`);
      
//       if (parsed.people && parsed.people.length > 0) {
//         console.log('\n👥 FOUND PEOPLE:');
//         parsed.people.forEach((person: any, index: number) => {
//           console.log(`${index + 1}. ${person.name} at ${person.company}`);
//           console.log(`   Role: ${person.role}`);
//           console.log(`   LinkedIn: ${person.linkedinUrl}`);
//           console.log(`   Confidence: ${person.confidence}/10`);
//           console.log('');
//         });
//       }
//     } catch (e) {
//       console.log('Result is not JSON format, showing raw content:');
//       console.log(result.substring(0, 500) + '...');
//     }
    
//     statusManager.completePhase('discovery', 'Discovery phase completed successfully!');
    
//     // Show all status updates
//     console.log('\n📋 === ALL STATUS UPDATES ===');
//     const allUpdates = statusManager.getAllUpdates();
//     allUpdates.forEach((update: any, index: number) => {
//       console.log(`${index + 1}. [${update.type.toUpperCase()}] ${update.message}`);
//     });
    
//   } catch (error) {
//     console.error('💀 Discovery test failed:', error);
//     statusManager.failPhase('discovery', `Discovery failed: ${error}`);
//   }
// })();