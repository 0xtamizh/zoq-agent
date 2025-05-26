// src/lib/mcp/client.ts - REPLACE ENTIRE FILE
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class BrightDataMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connecting: boolean = false;

  // Add timeout configuration in the connect method
  async connect() {
    if (this.client && !this.connecting) return this.client;
    if (this.connecting) {
      while (this.connecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.client;
    }
  
    this.connecting = true;
    
    try {
      console.log('🔄 Connecting to Bright Data MCP server...');
  
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@brightdata/mcp'],
        env: {
          ...process.env,
          API_TOKEN: process.env.API_TOKEN || '181eb500-e8dc-4ce8-9e12-1c4b38a47168'
        }
      });
  
      this.client = new Client(
        {
          name: 'zoq-agent',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );
  
      // Set longer timeout for the connection
      await Promise.race([
        this.client.connect(this.transport),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      const toolsResult = await this.client.listTools();
      console.log('✅ Connected to Bright Data MCP. Available tools:', 
        toolsResult.tools?.map(t => t.name) || []);
      
      this.connecting = false;
      return this.client;
      
    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      this.connecting = false;
      throw error;
    }
  }


 // src/lib/mcp/client.ts - UPDATE the callTool method
async callTool(name: string, arguments_: any) {
    const client = await this.connect();
    
    console.log(`🔧 Calling Bright Data MCP tool: ${name}`, arguments_);
    
    try {
      const result = await client?.callTool({
        name,
        arguments: arguments_
      });
      
      //console.log(`✅ Tool ${name} completed:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${name} failed:`, error);
      throw error;
    }
  }
  
  async listTools() {
    const client = await this.connect();
    const result = await client?.listTools();
    return result?.tools || [];
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }
}

export const brightDataMCP = new BrightDataMCPClient();