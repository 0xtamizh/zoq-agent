# ZOQ Agent 🤖

**Advanced Multi-Agent Research System with Real-Time Intelligence**

ZOQ Agent is a sophisticated AI-powered research platform that combines multiple specialized agents to discover, analyze, and generate actionable insights about people and organizations. Built with modern web technologies and powered by the Model Context Protocol (MCP), it delivers real-time research capabilities for various use cases including business development, recruitment, partnerships, and market research.

## 🎯 Key Features

- **Multi-Agent Architecture**: Orchestrated system with specialized agents for discovery, enrichment, and content generation
- **Real-Time Processing**: Live status updates and streaming results via Server-Sent Events (SSE)
- **Intelligent Research**: Advanced web scraping and data enrichment using Bright Data MCP
- **Contextual Analysis**: Deep profile analysis with personalized insights and contact strategies
- **Modern UI/UX**: Responsive interface with real-time progress tracking and comprehensive results display
- **Flexible Use Cases**: Adaptable for business development, recruitment, partnerships, and research

## 🔧 Architecture Overview

### Multi-Agent System

ZOQ Agent employs a **Master Orchestrator** pattern that coordinates four specialized agents:

```
┌─────────────────────┐
│  Master Orchestrator│
│   (Coordination)    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Planning Agent    │
│ (Strategy & Queries)│
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Discovery Agent    │
│ (People & Companies)│
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Enrichment Agent    │
│(Deep Research & AI) │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│Content Generation   │
│  (Personalized)     │
└─────────────────────┘
```

### Core Components

#### 1. **Master Orchestrator Agent** (`master-orchestrator-agent.ts`)
- **Purpose**: Coordinates the entire research pipeline
- **Responsibilities**: 
  - Query analysis and execution planning
  - Agent orchestration and error handling
  - Result compilation and data transformation
  - Status management and real-time updates

#### 2. **Discovery Agent** (`discovery-agent.ts`)
- **Purpose**: Finds and identifies target individuals/organizations
- **Capabilities**:
  - Multi-source web searches via Bright Data MCP
  - Profile URL extraction and validation
  - Basic contact information gathering
  - Confidence scoring for results

#### 3. **Enrichment Agent** (`enrichment-agent.ts`)
- **Purpose**: Deep profile research and data enhancement
- **Features**:
  - LinkedIn profile scraping
  - Company website analysis
  - Recent activity and news gathering
  - Pain point and opportunity identification
  - Email signal generation for personalization hooks

#### 4. **Content Generation Agent** (`email-writing-agent.ts`)
- **Purpose**: Creates personalized outreach content
- **Capabilities**:
  - Context-aware message generation
  - Personalization based on research insights
  - Multiple content types (emails, messages, proposals)
  - Quality validation and optimization

### Status Management System

The **StatusManager** (`status-manager.ts`) provides centralized status tracking:

```typescript
interface StatusUpdate {
  id: string;
  type: 'info' | 'success' | 'error' | 'progress' | 'data';
  phase: 'planning' | 'discovery' | 'enrichment' | 'email_writing';
  message: string;
  timestamp: string;
  data?: any;
  progress?: number;
}
```

## 🛠️ Technology Stack

### Backend
- **Node.js & TypeScript**: Core runtime and type safety
- **Next.js API Routes**: RESTful endpoints and SSE streaming
- **OpenAI GPT-4**: Large language model for intelligence
- **Bright Data MCP**: Web scraping and data collection
- **Model Context Protocol**: Standardized tool integration

### Frontend
- **React 18**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Server-Sent Events**: Real-time updates
- **Custom Hooks**: State management and data flow

### Key Integrations
- **OpenRouter API**: LLM access with model flexibility
- **Bright Data MCP**: Web scraping capabilities
- **LinkedIn Data**: Professional profile information
- **Company Websites**: Business intelligence gathering

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **API Keys** (see below)

### Required API Keys

1. **OpenRouter API Key**
   - Sign up at [OpenRouter.ai](https://openrouter.ai)
   - Get your API key from the dashboard
   - Supports GPT-4, Claude, and other models

2. **Bright Data API Token**
   - Register at [Bright Data](https://brightdata.com)
   - Access the MCP (Model Context Protocol) service
   - Get your API token for web scraping

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/zoq-agent.git
   cd zoq-agent
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Bright Data MCP Configuration
   API_TOKEN=your_bright_data_api_token_here
   
   # Optional: Custom Model Settings
   DEFAULT_MODEL=openai/gpt-4-turbo
   MAX_TOKENS=4000
   TEMPERATURE=0.3
   ```

4. **Install Bright Data MCP**
   ```bash
   npm install -g @brightdata/mcp
   ```

5. **Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
npm run build
npm run start
```

## 📝 Usage Examples

### Business Development Research
```
Find technology startup founders in Austin who recently raised Series A funding. Research their companies, identify growth challenges, and generate personalized outreach strategies for partnership opportunities.
```

### Recruitment Intelligence
```
Discover senior software engineers in the fintech space who are actively engaging with blockchain content on LinkedIn. Analyze their backgrounds and craft personalized recruitment messages highlighting relevant opportunities.
```

### Market Research
```
Identify decision-makers at mid-stage SaaS companies that have recently expanded internationally. Research their expansion strategies and generate insights for potential collaboration.
```

### Investment Research
```
Find founders of AI startups who have previously worked at major tech companies. Analyze their current ventures, team composition, and market positioning for investment evaluation.
```

## 🔄 Code Flow & Logic

### 1. **Query Processing Pipeline**

```typescript
// User submits research query
const query = "Find AI startup founders in Seattle";

// Master orchestrator analyzes and creates execution plan
const executionPlan = await generateSearchQueriesAndPlan(query);

// Plan includes:
// - Search strategies (8-10 targeted queries)
// - Target audience classification
// - User profile extraction
// - Expected output format
```

### 2. **Discovery Phase**

```typescript
// Discovery agent executes parallel searches
const searchResults = await Promise.all([
  searchEngine("AI startup founders Seattle LinkedIn"),
  searchEngine("Seattle artificial intelligence CEO contact"),
  searchEngine("Washington AI company founders 2024"),
  // ... additional targeted searches
]);

// Results processed and filtered
const discoveredPeople = extractAndValidateProfiles(searchResults);
```

### 3. **Enrichment Phase**

```typescript
// Enrichment agent performs deep research
for (const person of discoveredPeople) {
  // LinkedIn profile scraping
  const profileData = await scrapingAgent.getLinkedInProfile(person.linkedinUrl);
  
  // Company research
  const companyData = await scrapingAgent.scrapeCompanyWebsite(person.companyUrl);
  
  // Recent activity analysis
  const recentNews = await searchEngine(`${person.name} ${person.company} news 2024`);
  
  // Pain points and opportunities identification
  const insights = await analyzePersonalizedSignals(profileData, companyData, recentNews);
}
```

### 4. **Content Generation Phase**

```typescript
// Content generation with personalization
const personalizedContent = await generatePersonalizedContent({
  recipientData: enrichedProfile,
  userProfile: executionPlan.userProfile,
  contentType: executionPlan.contentType,
  personalizationHooks: enrichedProfile.emailSignals
});

// Quality validation and optimization
const validatedContent = validateContentQuality(personalizedContent);
```

### 5. **Real-Time Status Updates**

```typescript
// StatusManager broadcasts updates via EventEmitter
statusManager.on('update', (statusUpdate) => {
  // Frontend receives via SSE
  res.write(`data: ${JSON.stringify(statusUpdate)}\n\n`);
});

// Phase transitions tracked
statusManager.startPhase('discovery', 'Finding matching profiles...');
statusManager.updateProgress('discovery', 'Searching LinkedIn...', 30);
statusManager.completePhase('discovery', 'Found 5 relevant profiles');
```

## 🔧 MCP Implementation

### Bright Data Integration

The system uses the **Model Context Protocol (MCP)** for standardized tool integration:

```typescript
// MCP Client Setup
class BrightDataMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async connect() {
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['@brightdata/mcp'],
      env: { API_TOKEN: process.env.API_TOKEN }
    });

    this.client = new Client({
      name: 'zoq-agent',
      version: '1.0.0'
    }, {
      capabilities: { tools: {} }
    });

    await this.client.connect(this.transport);
  }

  async callTool(name: string, arguments_: any) {
    return await this.client?.callTool({ name, arguments: arguments_ });
  }
}
```

### Available MCP Tools

- **search_engine**: Web search across multiple engines
- **scrape_as_markdown**: Website content extraction
- **web_data_linkedin_person_profile**: LinkedIn profile data
- **web_data_linkedin_company_profile**: Company LinkedIn pages
- **scrape_as_html**: Full HTML page scraping

## 🎨 Frontend Architecture

### React Hook Pattern

```typescript
// Custom hook for agent state management
const useAgentStream = (): [AgentState, AgentActions] => {
  const [state, setState] = useState<AgentState>(initialState);
  
  const runAgent = useCallback(async (input: AgentInput) => {
    // SSE connection for real-time updates
    const response = await fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Accept': 'text/event-stream' },
      body: JSON.stringify(input)
    });

    // Process streaming updates
    const reader = response.body.getReader();
    // ... SSE processing logic
  }, []);

  return [state, { runAgent, reset, abort }];
};
```

### Component Structure

```
src/
├── components/
│   ├── agent/
│   │   ├── AgentInputForm.tsx      # Query input interface
│   │   ├── AgentWorkspace.tsx      # Progress tracking
│   │   ├── RealTimeStatusDisplay.tsx # Live updates
│   │   ├── ResultsContainer.tsx    # Results presentation
│   │   └── ProspectCard.tsx       # Individual result cards
│   └── ui/
│       └── ProgressBar.tsx        # Reusable UI components
├── lib/
│   ├── agent/                     # Agent implementations
│   ├── hooks/                     # React hooks
│   ├── mcp/                       # MCP integration
│   └── status/                    # Status management
└── pages/
    ├── api/agent/run.ts           # API endpoint
    └── index.tsx                  # Main interface
```

## 🔍 Error Handling & Reliability

### Retry Logic
```typescript
// Agent-level retry with exponential backoff
let attempt = 0;
while (attempt < this.retryAttempts) {
  try {
    const result = await this.executeTask();
    return result;
  } catch (error) {
    attempt++;
    await this.sleep(Math.pow(2, attempt) * 1000);
  }
}
```

### Status Recovery
```typescript
// Graceful error handling with status updates
try {
  await this.discoveryAgent.findPeople();
} catch (error) {
  this.statusManager.failPhase('discovery', error.message);
  // Attempt alternative approach or exit gracefully
}
```

## 🛡️ Privacy & Compliance

- **No Data Storage**: All processing is transient and session-based
- **Rate Limiting**: Respectful API usage with built-in delays
- **Public Data Only**: Only accesses publicly available information
- **User Consent**: Clear disclosure of data sources and usage
- **GDPR Compliance**: No personal data retention or tracking

## 📊 Performance Optimization

- **Parallel Processing**: Concurrent agent execution where possible
- **Streaming Updates**: Real-time progress without blocking
- **Efficient Caching**: Session-based caching for repeated queries
- **Resource Management**: Connection pooling and cleanup
- **Error Boundaries**: Graceful failure handling


### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```


**Built with ❤️ for the Bright Data Real-Time AI Agents Challenge**
