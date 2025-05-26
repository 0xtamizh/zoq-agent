// src/components/agent/AgentInputForm.tsx - FIXED WITH WORKING APPROACH
import React, { useState } from 'react';
import { AgentInput } from '@/lib/agent/types';

interface AgentInputFormProps {
  onSubmit: (agentInput: AgentInput) => void;
  isLoading: boolean;
  onResults?: (results: any) => void;
  onError?: (error: string) => void;
  hasStarted?: boolean; // Add this line
}
const AgentInputForm: React.FC<AgentInputFormProps> = ({ 
  onSubmit, 
  isLoading,
  onResults,
  onError,
  hasStarted = false
}) => {
  const [query, setQuery] = useState('');
  
  const [localLoading, setLocalLoading] = useState(false);

  // Direct API call function - THIS IS WHAT WAS MISSING
  const callApiDirectly = async (input: AgentInput) => {
    console.log('🚀 Form: Calling API directly as backup');
    setLocalLoading(true);
    
    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream' // Important for SSE
        },
        body: JSON.stringify({
          query: input.query,
          criteria: input.criteria,
          productInfo: input.productInfo
        }),
      });

      console.log('📨 Direct API Response:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // For SSE responses, just indicate success
      console.log('✅ Direct API call initiated successfully');
      onResults?.({ message: 'SSE stream started successfully' });

    } catch (error) {
      console.error('💥 Direct API Error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if already loading
    if (isLoading || localLoading) {
      console.log('⏸ Form submission blocked - already loading');
      return;
    }
    
    console.log('📝 Form submission started');
    
    if (!query.trim()) {
      console.log('❌ Empty query');
      alert('Please enter a search query');
      return;
    }

    console.log('📝 Form validation passed');
    
    const agentInput: AgentInput = {
      query: query.trim(),
    };

    console.log('📤 Input data prepared:', agentInput);
    
    try {
      console.log('📤 Calling onSubmit handler...');
      // Try the hook first
      await onSubmit(agentInput);
      console.log('✅ onSubmit handler completed');
      
      // Also call API directly as backup (like the working version)
      console.log('📤 Calling direct API as backup...');
      await callApiDirectly(agentInput);
      
    } catch (error) {
      console.error('❌ Error in form submission:', error);
      alert('Failed to start the agent. Please try again.');
    }
  };

  const currentlyLoading = isLoading || localLoading;
  return (
    <div className={hasStarted ? "card" : "w-full"}>
      {hasStarted && <h2 className="text-xl font-bold mb-6">ZOQ Agent</h2>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {!hasStarted && (
            <label htmlFor="query" className="sr-only">
              Search Query
            </label>
          )}
          {hasStarted && (
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              Search Query <span className="text-red-500">*</span>
            </label>
          )}
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., find ai saas founders in Dubai and send them personalized emails about my outreach tool - zoq ai"
            className={`w-full border focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              hasStarted 
                ? 'p-3 text-base border-gray-300 rounded-lg bg-white text-gray-900' 
                : 'p-4 text-base h-14 rounded-xl shadow-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400'
            }`}
            rows={hasStarted ? 3 : 1}
            disabled={currentlyLoading}
            required
          />
          {hasStarted && (
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500 flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{query.length}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={currentlyLoading || !query.trim()}
            className={`font-medium transition-all duration-200 ${
              currentlyLoading || !query.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : hasStarted 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800'
            } rounded-full px-8 py-2`}
          >
            {currentlyLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              hasStarted ? 'Start ZOQ Agent' : 'Start Research →'
            )}
          </button>
        </div>
      </form>

      {hasStarted && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
          <div className="text-gray-600 mb-1">Debug Info:</div>
          <div className="text-green-600">Form ready: {query ? '✅' : '❌'}</div>          
          <div className="text-blue-600">Hook loading: {isLoading ? 'Yes' : 'No'}</div>
          <div className="text-purple-600">Direct loading: {localLoading ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};  
export default AgentInputForm;