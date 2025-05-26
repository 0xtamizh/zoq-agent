// src/lib/hooks/useAgentStream.ts - FIXED WITH PROPER PROSPECT EXTRACTION
import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentInput, AgentUpdate, AgentPhase } from '@/lib/agent/types';
import { Prospect } from '@/components/agent/types';

interface AgentState {
  isRunning: boolean;
  updates: AgentUpdate[];
  currentPhase: AgentPhase;
  prospects: Prospect[];
  error: string | null;
}

interface AgentActions {
  runAgent: (input: AgentInput) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

const initialState: AgentState = {
  isRunning: false,
  updates: [],
  currentPhase: 'idle',
  prospects: [],
  error: null
};

export default function useAgentStream(): [AgentState, AgentActions] {
  const [state, setState] = useState<AgentState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Hook: Cleaning up connections');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const runAgent = useCallback(async (input: AgentInput) => {
    console.log('🚀 Hook: Starting agent with input:', input);
    
    // Cleanup any existing connections
    cleanup();
    
    // Reset state for new run
    setState(prev => ({
      ...initialState,
      isRunning: true,
      updates: [],
      currentPhase: 'planning'
    }));

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      console.log('📡 Hook: Making API request...');
      
      // Make the initial API request with SSE stream
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          query: input.query,
          criteria: input.criteria,
          productInfo: input.productInfo
        }),
        signal: abortControllerRef.current.signal
      });

      console.log('📨 Hook: API response received:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for SSE stream');
      }

      // Process the SSE stream directly from the response
      console.log('🔗 Hook: Processing SSE stream...');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🏁 Hook: Stream reading completed');
            setState(prev => ({ ...prev, isRunning: false }));
            break;
          }

          // Decode the chunk
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove 'data: ' prefix
              
              if (data === '[DONE]') {
                console.log('🏁 Hook: Stream completed');
                setState(prev => ({ ...prev, isRunning: false }));
                return;
              }

              try {
                const update = JSON.parse(data);
                console.log('📦 Hook: Parsed update:', update);

                // Handle different types of updates
                if (update.type === 'status-update') {
                  const agentUpdate: AgentUpdate = {
                    type: 'status',
                    phase: update.phase || 'planning',
                    message: update.message || '',
                    progress: update.progress || 0,
                    thinking: update.thinking || update.message || '',
                    timestamp: Date.now(),
                  };

                  setState(prev => ({
                    ...prev,
                    updates: [...prev.updates, agentUpdate],
                    currentPhase: update.phase || prev.currentPhase,
                    error: null
                  }));

                } else if (update.type === 'final-result') {
                  console.log('🎯 Hook: Final result received:', update.result);
                  
                  // IMPORTANT: Extract prospects from the result
                  const prospects = update.result?.prospects || [];
                  console.log('👥 Hook: Extracted prospects:', prospects.length);
                  console.log('📋 Hook: First prospect sample:', prospects[0]);
                  
                  // Create completion update
                  const completionUpdate: AgentUpdate = {
                    type: 'data',
                    phase: 'complete',
                    message: `Process completed! Found ${prospects.length} prospects with personalized emails.`,
                    progress: 100,
                    timestamp: Date.now(),
                    results: {
                      prospects: prospects
                    }
                  };

                  setState(prev => ({
                    ...prev,
                    updates: [...prev.updates, completionUpdate],
                    currentPhase: 'complete',
                    prospects: prospects as Prospect[], // ⭐ THIS IS THE KEY FIX
                    isRunning: false,
                    error: null
                  }));

                  // Stream is complete
                  return;

                } else if (update.type === 'error') {
                  console.error('❌ Hook: Error update received:', update.message);
                  
                  const errorUpdate: AgentUpdate = {
                    type: 'error',
                    phase: 'error',
                    message: update.message || 'Unknown error occurred',
                    progress: 0,
                    timestamp: Date.now(),
                    error: update.message
                  };

                  setState(prev => ({
                    ...prev,
                    updates: [...prev.updates, errorUpdate],
                    currentPhase: 'error',
                    isRunning: false,
                    error: update.message || 'Unknown error occurred'
                  }));

                  return;
                }

              } catch (parseError) {
                console.error('❌ Hook: Error parsing SSE data:', parseError, data);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('❌ Hook: Stream reading error:', streamError);
        setState(prev => ({
          ...prev,
          isRunning: false,
          currentPhase: 'error',
          error: 'Stream reading failed'
        }));
      } finally {
        reader.releaseLock();
      }

    } catch (error: any) {
      console.error('💥 Hook: Error in runAgent:', error);
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentPhase: 'error',
        error: error.message || 'Failed to start agent'
      }));
    }
  }, [cleanup]);

  const reset = useCallback(() => {
    console.log('🔄 Hook: Resetting state');
    cleanup();
    setState(initialState);
  }, [cleanup]);

  const abort = useCallback(() => {
    console.log('🛑 Hook: Aborting agent');
    cleanup();
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentPhase: 'idle'
    }));
  }, [cleanup]);

  return [state, { runAgent, reset, abort }];
}