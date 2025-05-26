// src/lib/mcp/executor.ts
import { brightDataMCP } from './client';

export async function executeMcpTool(toolName: string, params: any) {
  console.log(`Executing MCP tool: ${toolName}`, params);
  
  try {
    const result = await brightDataMCP.callTool(toolName, params);
    return result;
  } catch (error: any) {
    console.error(`Error executing ${toolName}:`, error);
    return { error: error.message };
  }
}