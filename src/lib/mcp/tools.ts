// Try to import mock tools if needed
let mockTools: any[] = [];
try {
  mockTools = require('./mock-server').mockTools;
} catch (error) {
  console.log('Mock tools not loaded');
}

// MCP tools definition for LLM function calling
export const mcpTools = [
  {
    type: 'function' as const,
    function: {
      name: 'discoverProspects',
      description: 'Searches for prospects matching specific criteria on LinkedIn',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (e.g., "tech founders in Seattle")'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'accessLinkedInProfile',
      description: 'Accesses a specific LinkedIn profile page',
      parameters: {
        type: 'object',
        properties: {
          profileUrl: {
            type: 'string',
            description: 'URL of the LinkedIn profile'
          }
        },
        required: ['profileUrl']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'extractProfileData',
      description: 'Extracts structured data from a LinkedIn profile',
      parameters: {
        type: 'object',
        properties: {
          profileUrl: {
            type: 'string',
            description: 'URL of the LinkedIn profile'
          }
        },
        required: ['profileUrl']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'accessCompanyWebsite',
      description: 'Accesses a company website and extracts key information',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Company website domain'
          }
        },
        required: ['domain']
      }
    }
  }
];

// OpenAI tool definition type
export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
};

// MCP tool execution result type
export type ToolExecutionResult = {
  success: boolean;
  data?: any;
  error?: string;
};

// MCP Tool Names
export type McpToolName = 
  | 'discoverProspects'
  | 'accessLinkedInProfile'
  | 'extractProfileData'
  | 'accessCompanyWebsite';
