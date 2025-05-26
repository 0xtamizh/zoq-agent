declare module '@brightdata/mcp' {
  interface StartServerOptions {
    env?: {
      API_TOKEN: string;
      WEB_UNLOCKER_ZONE?: string;
      BROWSER_AUTH?: string;
    };
    port?: number;
  }

  interface McpServer {
    close: () => Promise<void>;
    // Add other methods as needed
  }

  export function startServer(options: StartServerOptions): Promise<McpServer>;
}
