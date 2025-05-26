// src/agents/email-writing-agent.ts - WITH STATUS MANAGER INTEGRATION
import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { StatusManager } from '../status/status-manager';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface PersonalizedEmail {
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

interface EmailResponse {
  emails: PersonalizedEmail[];
  totalEmails: number;
  averagePersonalization: number;
  averageConfidence: number;
  emailType: string;
  status: string;
  message?: string;
  generationTime: string;
}

export class EmailWritingAgent extends EventEmitter {
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

  async generatePersonalizedEmails(enrichedData: string, emailParams: any): Promise<string> {
    // System logs for debugging
    console.log('📧 Email Writing Agent: Generating hyper-personalized emails...');
    console.log(`🎯 Email Type: ${emailParams.emailType}`);
    console.log(`👤 From: ${emailParams.userProfile?.name || 'User'}`);
    
    // User-facing status updates
    this.statusManager?.updateInfo('email_writing', 'Generating personalized cold emails...');
    this.statusManager?.updateProgress('email_writing', 'Analyzing enriched profiles...', 10);
    
    // Extract enriched profiles for logging
    const enrichedProfiles = this.extractEnrichedProfilesForLogging(enrichedData);
    if (enrichedProfiles.length > 0) {
      console.log(`📝 Writing emails for ${enrichedProfiles.length} people:`, enrichedProfiles); // System log
      
      // Show email targets to user
      this.statusManager?.updateInfo('email_writing', `📝 Writing emails for ${enrichedProfiles.length} people:`);
      enrichedProfiles.forEach((profile, index) => {
        this.statusManager?.updateInfo('email_writing', `   ${index + 1}. ${profile.name} at ${profile.company}`);
      });
    }
    
    this.statusManager?.updateProgress('email_writing', 'Crafting hyper-personalized messages...', 30);
    
    const startTime = Date.now();
    
    const prompt = `🎯 HYPER-PERSONALIZED COLD EMAIL WRITING MISSION

ENRICHED PROFILE DATA:
${enrichedData}

EMAIL PARAMETERS:
${JSON.stringify(emailParams, null, 2)}

🚨 CRITICAL: RETURN STRUCTURED JSON RESPONSE

RETURN FORMAT - EXACT JSON STRUCTURE:

{
  "emails": [
    {
      "recipientName": "Full Name",
      "recipientEmail": "person@company.com",
      "recipientCompany": "Company Name",
      "subject": "Let AI handle your outreach while you perfect DashChat",
      "body": "Hey [Name],\n\nSaw DashChat on Buildspace - text-to-SQL with chat interface is brilliant!\n\nBuilding + validating + finding test users solo is brutal. I've been there.\n\nAt Prospect AI, we automate the entire outreach process. While you're iterating on DashChat, we're booking calls with potential users and early adopters.\n\nWe helped Cosserp book $50K in pipeline in 6 weeks - all automated.\n\nQuick thought: I handle your user acquisition pipeline, you focus 100% on product.\n\nWorth a 15-min chat to see if I can get you 50+ beta testers this month?\n\nBest,\nKanoj\nFounder, Prospect AI",
      "personalizationPoints": [
        "Referenced DashChat project from Buildspace",
        "Mentioned text-to-SQL interface specifically",
        "Addressed solo founder challenges",
        "Specific case study with Cosserp",
        "Targeted pain point: user acquisition vs product development"
      ],
      "confidence": 9.2,
      "emailType": "sales_outreach",
      "wordCount": 78
    }
  ],
  "totalEmails": 3,
  "averagePersonalization": 8.7,
  "averageConfidence": 8.9,
  "emailType": "sales_outreach",
  "status": "success",
  "generationTime": "2.3s"
}

🚨 EMAIL WRITING REQUIREMENTS:

STYLE GUIDELINES:
✅ ULTRA SHORT - Maximum 60-80 words per email
✅ NO generic openers ("Hope this finds you well", "I hope you're doing great")
✅ NO corporate fluff or buzzwords
✅ Start with SPECIFIC, RECENT reference (their post, company news, interview)
✅ ONE clear value proposition sentence
✅ ONE specific result/case study mention
✅ Simple, conversational ask
✅ No signatures or formal endings

PERSONALIZATION REQUIREMENTS:
🎯 Reference their RECENT activity (LinkedIn posts, tweets, interviews, speaking events)
🎯 Mention their SPECIFIC company situation (funding, product launch, challenges)
🎯 Connect to their INTERESTS/PAIN POINTS
🎯 Match their WRITING STYLE (formal/casual, technical/business)
🎯 Show you ACTUALLY researched them (not generic)

EMAIL FORMULA:
1. SPECIFIC HOOK (recent activity/post/news)
2. RELEVANT CONNECTION (how you relate)
3. VALUE PROP (what you offer)
4. PROOF POINT (quick result/case study)
5. SIMPLE ASK (brief call/chat)

EMAIL TYPE FOCUS:
- **sales_outreach**: Focus on ROI, efficiency, results, scaling challenges
- **collaboration**: Focus on synergies, mutual value, shared vision
- **hiring_pitch**: Focus on skills match, culture fit, growth opportunities
- **startup_pitch**: Focus on market opportunity, team expertise, traction

TONE: Conversational, confident, specific, human-like
LENGTH: 3-4 sentences maximum
GOAL: Get them curious enough to reply

Generate hyper-personalized emails for each person in the enriched data. Use ALL the email signals you have about them.

🚀 RETURN ONLY JSON RESPONSE - NO ADDITIONAL TEXT!`;

    let attempt = 0;
    const maxDuration = 15000; // 15 seconds
    
    while (attempt < this.retryAttempts) {
      try {
        console.log(`✍️ Email Writing Attempt ${attempt + 1}/${this.retryAttempts}`); // System log
        
        if (attempt > 0) {
          this.statusManager?.updateInfo('email_writing', `Email writing attempt ${attempt + 1}/${this.retryAttempts}...`);
        }
        
        this.statusManager?.updateProgress('email_writing', 'Adding personalization hooks...', 60);
        
        const currentTime = Date.now();
        if (currentTime - startTime > maxDuration) {
          console.log('⏳ Working more, hang tight... Checking status...'); // System log
          this.statusManager?.updateProgress('email_writing', '⏳ Working more, hang tight... Checking status...', 70);
        }
        
        this.statusManager?.updateProgress('email_writing', 'Optimizing for response rates...', 80);
        
        const response = await this.openai.chat.completions.create({
          model: 'openai/gpt-4.1-mini',
          max_tokens: 3000,
          temperature: 0.4,
          messages: [{ role: 'user', content: prompt }]
        });

        const emailContent = response.choices[0]?.message?.content || '';
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (emailContent.length > 100) {
          this.statusManager?.updateProgress('email_writing', 'Validating email quality...', 90);
          
          // Extract emails for logging
          const emailsData = this.extractEmailsForLogging(emailContent);
          
          if (emailsData.length > 0) {
            console.log('📧 Generated personalized emails:', emailsData); // System log
            
            // Show generated emails to user
            this.statusManager?.updateSuccess('email_writing', `📧 Successfully generated ${emailsData.length} personalized emails:`);
            
            emailsData.forEach((email, index) => {
              this.statusManager?.updateData('email_writing', 
                `${index + 1}. To: ${email.recipientName} at ${email.recipientCompany}`, 
                { email, index }
              );
              this.statusManager?.updateInfo('email_writing', `      Subject: ${email.subject}`);
              
              const personalization = email.personalizationPoints?.slice(0, 2).join(', ') || 'Basic personalization';
              this.statusManager?.updateInfo('email_writing', `      Personalization: ${personalization}`);
              
              if (email.recipientEmail) {
                this.statusManager?.updateInfo('email_writing', `      Email: ${email.recipientEmail}`);
              }
            });
            
            // Show email data for master agent
            this.statusManager?.updateData('email_writing', 'Generated emails data', {
              emails: emailsData,
              totalEmails: emailsData.length,
              averageConfidence: emailsData.reduce((acc, email) => acc + (email.confidence || 7), 0) / emailsData.length,
              emailType: emailParams.emailType,
              generationTime: `${duration}s`
            });
          }
          
          const qualityScore = this.validateEmailQuality(emailContent);
          console.log(`📊 Email Quality Score: ${qualityScore}/10`); // System log
          
          if (qualityScore >= 6) {
            console.log(`✅ Email Writing Success! Generated ${emailContent.length} characters in ${duration}s`); // System log
            this.statusManager?.updateSuccess('email_writing', `✅ Done! Email generation completed in ${duration}s`);
            return emailContent;
          } else {
            console.log(`⚠️ Email quality too low (${qualityScore}/10), retrying...`); // System log
            this.statusManager?.updateInfo('email_writing', `Email quality score: ${qualityScore}/10 - refining approach...`);
          }
        } else {
          console.log(`⚠️ Attempt ${attempt + 1} - insufficient email content`); // System log
          this.statusManager?.updateInfo('email_writing', `Attempt ${attempt + 1} - insufficient content, retrying...`);
        }
        
        attempt++;
        
      } catch (error) {
        console.error(`❌ Email writing attempt ${attempt + 1} failed:`, error); // System log
        this.statusManager?.updateInfo('email_writing', `Email writing attempt ${attempt + 1} encountered issues...`);
        attempt++;
        
        if (attempt >= this.retryAttempts) {
          console.error('❌ All email writing attempts failed'); // System log
          this.statusManager?.updateInfo('email_writing', '❌ Unable to generate quality emails after multiple attempts');
          
          const errorResponse: EmailResponse = {
            emails: [],
            totalEmails: 0,
            averagePersonalization: 0,
            averageConfidence: 0,
            emailType: emailParams.emailType || 'unknown',
            status: 'failed',
            message: `Unable to generate quality emails after ${this.retryAttempts} attempts. Error: ${error}`,
            generationTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
          };
          return JSON.stringify(errorResponse);
        }
        
        console.log(`🔄 Retrying email writing in 2 seconds...`); // System log
        this.statusManager?.updateInfo('email_writing', 'Adjusting email strategy and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const failedResponse: EmailResponse = {
      emails: [],
      totalEmails: 0,
      averagePersonalization: 0,
      averageConfidence: 0,
      emailType: emailParams.emailType || 'unknown',
      status: 'failed',
      message: 'No attempts succeeded',
      generationTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    };
    return JSON.stringify(failedResponse);
  }

  private extractEnrichedProfilesForLogging(content: string): any[] {
    const profiles: any[] = [];
    
    try {
      // Use regex to find name and company pairs
      const nameRegex = /"name":\s*"([^"]+)"/g;
      const companyRegex = /"company":\s*"([^"]+)"/g;
      
      let nameMatch, companyMatch;
      const names: string[] = [];
      const companies: string[] = [];
      
      while ((nameMatch = nameRegex.exec(content)) !== null) {
        names.push(nameMatch[1]);
      }
      while ((companyMatch = companyRegex.exec(content)) !== null) {
        companies.push(companyMatch[1]);
      }
      
      // Combine the data
      for (let i = 0; i < Math.min(names.length, companies.length); i++) {
        profiles.push({
          name: names[i],
          company: companies[i]
        });
      }
    } catch (error) {
      console.log('⚠️ Could not extract profiles for logging, but continuing...'); // System log
    }
    
    return profiles;
  }

  private extractEmailsForLogging(content: string): PersonalizedEmail[] {
    const emails: PersonalizedEmail[] = [];
    
    try {
      // Use regex to find JSON structures
      const jsonRegex = /\{[\s\S]*?"emails"[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/g;
      const matches = content.match(jsonRegex);
      
      if (matches) {
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match);
            if (parsed.emails && Array.isArray(parsed.emails)) {
              emails.push(...parsed.emails);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
      
      // Fallback: extract individual email objects
      if (emails.length === 0) {
        const emailRegex = /\{[^{}]*"recipientName"[^{}]*"subject"[^{}]*\}/g;
        const emailMatches = content.match(emailRegex);
        
        if (emailMatches) {
          for (const match of emailMatches) {
            try {
              const email = JSON.parse(match);
              if (email.recipientName && email.subject) {
                emails.push(email);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not extract emails for logging, but continuing...'); // System log
    }
    
    return emails;
  }

  private validateEmailQuality(emailContent: string): number {
    let score = 10;
    
    // Check for generic phrases (penalize heavily)
    const genericPhrases = [
      'hope this finds you well',
      'hope you\'re doing well',
      'i hope this email',
      'reaching out to you',
      'wanted to connect',
      'i came across your profile',
      'i would love to discuss',
      'would you be interested'
    ];
    
    for (const phrase of genericPhrases) {
      if (emailContent.toLowerCase().includes(phrase)) {
        score -= 2;
        console.log(`❌ Generic phrase detected: "${phrase}"`); // System log
      }
    }
    
    // Check for personalization signals (reward)
    const personalizationSignals = [
      'saw your',
      'loved your',
      'noticed your',
      'congrats on',
      'your recent',
      'your post',
      'your interview',
      'your company',
      'just read'
    ];
    
    let personalizationCount = 0;
    for (const signal of personalizationSignals) {
      if (emailContent.toLowerCase().includes(signal)) {
        personalizationCount++;
      }
    }
    
    if (personalizationCount === 0) {
      score -= 3;
      console.log(`❌ No personalization signals detected`); // System log
    } else {
      console.log(`✅ Found ${personalizationCount} personalization signals`); // System log
    }
    
    // Check for specific numbers/metrics (reward)
    const numberPattern = /\$?\d+[KkMm]?/g;
    const numbers = emailContent.match(numberPattern);
    if (numbers && numbers.length > 0) {
      console.log(`✅ Specific metrics found: ${numbers.join(', ')}`); // System log
    } else {
      score -= 1;
      console.log(`⚠️ No specific metrics mentioned`); // System log
    }
    
    // Check email length (too long is bad)
    if (emailContent.length > 1500) {
      score -= 2;
      console.log(`❌ Email too long: ${emailContent.length} characters`); // System log
    } else if (emailContent.length < 100) {
      score -= 2;
      console.log(`❌ Email too short: ${emailContent.length} characters`); // System log
    }
    
    return Math.max(0, Math.min(10, score));
  }
}

// // Test execution with status manager
// (async () => {
//   console.log('🚀 Testing Email Writing Agent with Status Manager...\n');
  
//   const statusManager = new StatusManager();
//   const emailAgent = new EmailWritingAgent(statusManager);
  
//   // Listen to status updates
//   statusManager.on('update', (update: any) => {
//     // This is what would be sent to the frontend
//     console.log(`[USER UPDATE] ${update.message}`);
//     if (update.data?.emails) {
//       console.log(`[DATA] Generated ${update.data.emails.length} emails`);
//     }
//   });
  
//   // Mock enriched data
//   const mockEnrichedData = JSON.stringify({
//     enrichedProfiles: [
//       {
//         name: "Anuj Bishnoi",
//         company: "RePut.ai",
//         role: "Co-founder",
//         personalInfo: {
//           linkedinUrl: "https://linkedin.com/in/anuj-bishnoi",
//           email: "anuj@reput.ai",
//           location: "Bangalore, India"
//         },
//         companyInfo: {
//           companyUrl: "https://reput.ai",
//           fundingStage: "Pre-seed",
//           teamSize: 5,
//           mainProduct: "AI-powered reputation management"
//         },
//         keyInsights: [
//           "Recently launched AI reputation platform",
//           "Focus on B2B SaaS market",
//           "Growing team in Bangalore"
//         ],
//         emailSignals: {
//           painPoints: ["Manual reputation monitoring", "Scaling customer acquisition"],
//           opportunities: ["AI automation", "Process optimization"],
//           personalizedHooks: ["Recent product launch", "B2B SaaS expertise"],
//           currentChallenges: ["User acquisition", "Product market fit"]
//         },
//         confidence: 8.5
//       },
//       {
//         name: "Shiva Dhawan",
//         company: "attentive AI",
//         role: "CEO",
//         personalInfo: {
//           linkedinUrl: "https://linkedin.com/in/shivadw",
//           email: "shiva@attentive.ai",
//           location: "Bangalore, India"
//         },
//         companyInfo: {
//           companyUrl: "https://attentive.ai",
//           fundingStage: "Seed",
//           teamSize: 12,
//           mainProduct: "AI-based mapping solutions"
//         },
//         keyInsights: [
//           "Scaling AI mapping technology",
//           "Partnership with major logistics companies",
//           "Expanding internationally"
//         ],
//         emailSignals: {
//           painPoints: ["Scaling user adoption", "International expansion"],
//           opportunities: ["Sales automation", "User acquisition"],
//           personalizedHooks: ["Recent partnerships", "International growth"],
//           currentChallenges: ["User onboarding", "Sales scaling"]
//         },
//         confidence: 9.0
//       }
//     ],
//     totalSearches: 8,
//     sourcesScraped: 6,
//     status: "success"
//   });
  
//   const emailParams = {
//     emailType: 'sales_outreach',
//     userProfile: {
//       name: 'Kanoj Vora',
//       company: 'ProspectAI.co',
//       valueProposition: 'AI sales automation at scale',
//       caseStudy: 'Recently helped a company generate $50K pipeline'
//     }
//   };
  
//   try {
//     statusManager.startPhase('email_writing', 'Starting email writing phase...');
    
//     const result = await emailAgent.generatePersonalizedEmails(mockEnrichedData, emailParams);
    
//     console.log('\n🎯 === EMAIL WRITING RESULT ===');
//     console.log(`Result Length: ${result.length} characters`);
    
//     // Parse and show structured result
//     try {
//       const parsed = JSON.parse(result);
//       console.log(`Status: ${parsed.status}`);
//       console.log(`Emails Generated: ${parsed.emails?.length || 0}`);
//       console.log(`Average Confidence: ${parsed.averageConfidence || 0}/10`);
//       console.log(`Generation Time: ${parsed.generationTime || 'N/A'}`);
      
//       if (parsed.emails && parsed.emails.length > 0) {
//         console.log('\n📧 GENERATED EMAILS:');
//         parsed.emails.forEach((email: any, index: number) => {
//           console.log(`${index + 1}. TO: ${email.recipientName} <${email.recipientEmail}>`);
//           console.log(`   COMPANY: ${email.recipientCompany}`);
//           console.log(`   SUBJECT: ${email.subject}`);
//           console.log(`   BODY: ${email.body.substring(0, 200)}...`);
//           console.log(`   PERSONALIZATION: ${email.personalizationPoints?.slice(0, 2).join(', ') || 'Basic'}`);
//           console.log(`   CONFIDENCE: ${email.confidence}/10`);
//           console.log(`   WORD COUNT: ${email.wordCount || 'N/A'}`);
//           console.log('');
//         });
//       }
//     } catch (e) {
//       console.log('Result is not JSON format, showing raw content:');
//       console.log(result.substring(0, 500) + '...');
//     }
    
//     statusManager.completePhase('email_writing', 'Email writing phase completed successfully!');
    
//     // Show all status updates
//     console.log('\n📋 === ALL STATUS UPDATES ===');
//     const allUpdates = statusManager.getAllUpdates();
//     allUpdates.forEach((update: any, index: number) => {
//       console.log(`${index + 1}. [${update.type.toUpperCase()}] ${update.message}`);
//     });
    
//   } catch (error) {
//     console.error('💀 Email writing test failed:', error);
//     statusManager.failPhase('email_writing', `Email writing failed: ${error}`);
//   }
// })();