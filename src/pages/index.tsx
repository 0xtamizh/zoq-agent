// src/pages/index.tsx - WITH DEBUG PANEL FOR TROUBLESHOOTING
"use client";
import React, { useState } from 'react';
import Head from 'next/head';
import { AgentInput, AgentPhase } from '@/lib/agent/types';
import { Prospect } from '@/components/agent/types';
import AgentInputForm from '@/components/agent/AgentInputForm';
import AgentWorkspace from '@/components/agent/AgentWorkspace';
import ResultsContainer from '@/components/agent/ResultsContainer';
import useAgentStream from '@/lib/hooks/useAgentStream';

export default function Home() {
  // Use our enhanced hook for agent stream management
  const [hasStarted, setHasStarted] = useState(false);

  const [
    { isRunning, updates, currentPhase, prospects, error },
    { runAgent, reset, abort }
  ] = useAgentStream();
  
  // Add console logging to track state changesgrey
  console.log('🏠 Main component state:', {
    isRunning,
    currentPhase,
    updatesCount: updates.length,
    prospectsCount: prospects.length,
    error,
    latestUpdate: updates[updates.length - 1]
  });
  
  // Handle form submission
  const handleSubmit = (agentInput: AgentInput) => {
    console.log('🎯 Main: Starting agent with input:', agentInput);
    setHasStarted(true);
    runAgent(agentInput);
  };
  
  // Handle results from direct API call (for working compatibility)
  const handleResults = (results: any) => {
    console.log('📨 Main: Received direct results:', results);
    // The direct API call just initiates the SSE stream
    // Results will come through the hook
  };
  
  // Handle errors from direct API call
  const handleError = (errorMessage: string) => {
    console.error('❌ Main: Received direct error:', errorMessage);
    // Could display error in UI if needed
  };
  
  // Handle abort
  const handleAbort = () => {
    console.log('🛑 Main: Aborting agent process');
    abort();
  };

  const handleReset = () => {
    console.log('🔄 Main: Resetting agent state');
    setHasStarted(false);
    reset();
  };

  return (
<div className="min-h-screen bg-neutral-900">      <Head>
        <title>ZOQ Agent | Real-Time Business Development</title>
        <meta name="description" content="Real-time autonomous business development agent powered by StatusManager and MasterOrchestratorAgent" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-neutral-900 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white">ZOQ Agent</h1>
              <div className="hidden sm:block px-3 py-1 bg-blue-600 text-blue-100 text-sm font-medium rounded-full">
                Real-Time AI Agent
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-300">
                Bright Data Real-Time AI Challenge
              </div>
              <div className="text-xs text-gray-400">
                StatusManager + MasterOrchestrator
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!hasStarted ? (
          /* Centered Initial State */
          <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  What can I help you with today?
                </h2>
                <p className="text-lg text-gray-300">
                  Tell me what you need and I'll find prospects and create personalized emails
                </p>
              </div>
              
              <AgentInputForm 
                onSubmit={handleSubmit} 
                isLoading={isRunning}
                onResults={handleResults}
                onError={handleError}
                hasStarted={hasStarted}
              />
            </div>
          </div>
        ) : (
          /* Post-submission Layout */
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Query Display at Top */}
            <div className="bg-neutral-800 rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Current Request</h3>
                  <p className="text-white">{updates[0]?.message || 'Processing your request...'}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  New Request
                </button>
              </div>
            </div>

            {/* Agent Workspace */}
            <AgentWorkspace 
              updates={updates} 
              currentPhase={currentPhase}
              isRunning={isRunning}
              onAbort={handleAbort}
            />
            
            {/* Error Display */}
            {error && currentPhase === 'error' && (
              <div className="card border-red-200 bg-red-50">
                <div className="flex items-start space-x-3">
                  <div className="text-red-500 text-xl">⚠️</div>
                  <div className="flex-1">
                    <div className="font-semibold text-red-900 mb-1">
                      Something went wrong
                    </div>
                    <div className="text-sm text-red-700 mb-3">
                      {error}
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-secondary text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Results */}
            <ResultsContainer 
              prospects={prospects} 
              isLoading={isRunning && currentPhase === 'discovery'} 
            />
          </div>
        )}
      </main>
    {/* Footer */}
    <footer className="bg-neutral-900 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-white mb-2">
              ZOQ Agent - Real-Time Business Development Automation
            </p>
            <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
              <span>Powered by Bright Data MCP</span>
              <span>•</span>
              <span>StatusManager Integration</span>
              <span>•</span>
              <span>OpenAI API</span>
            </div>
            <p className="text-xs text-white mt-2">
              Built for the Bright Data Real-Time AI Agents Challenge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}