// src/components/agent/AgentWorkspace.tsx - ENHANCED WITH SMOOTH PROGRESS
import React from 'react';
import { AgentPhase, AgentUpdate } from '../../lib/agent/types';
import RealTimeStatusDisplay from './RealTimeStatusDisplay';
import ProgressBar from '../ui/ProgressBar';

interface AgentWorkspaceProps {
  updates: AgentUpdate[];
  currentPhase: AgentPhase;
  isRunning: boolean;
  onAbort?: () => void;
}

const phaseLabels: Record<AgentPhase, string> = {
  planning: 'Planning Search Strategy',
  discovery: 'Discovering Prospects',
  research: 'Researching Prospects', 
  generation: 'Generating Outreach',
  complete: 'Process Complete',
  error: 'Error Occurred',
  enrichment: 'Enriching Prospect Data',
  email: 'Preparing Emails',
  idle: 'Waiting to Start'
};

const phaseEmojis: Record<AgentPhase, string> = {
  planning: '🧠',
  discovery: '🔍',
  research: '📊', 
  generation: '✍️',
  complete: '🎉',
  error: '⚠️',
  enrichment: '🔬',
  email: '📧',
  idle: '⏳'
};

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({ 
  updates, 
  currentPhase, 
  isRunning,
  onAbort 
}) => {
  const latestUpdate = updates[updates.length - 1];
  const currentProgress = currentPhase === 'complete' ? 100 : (latestUpdate?.progress || 0);
  return (
    <div className="space-y-6">
      {/* Main Status Display */}
      <RealTimeStatusDisplay 
        updates={updates}
        currentPhase={currentPhase}
        isRunning={isRunning}
      />

      {/* Enhanced Quick Stats & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Status Card */}
        <div className="card bg-gray-800 border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
              <span className="text-lg">{phaseEmojis[currentPhase]}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-300">Current Phase</div>
              <div className="font-semibold text-white text-sm">
                {phaseLabels[currentPhase]}
              </div>
              {/* Status indicator */}
              <div className="flex items-center mt-1">
                <div className={`
                  w-2 h-2 rounded-full mr-2
                  ${isRunning ? 'bg-green-500 animate-pulse' : currentPhase === 'complete' ? 'bg-green-500' : 'bg-gray-400'}
                `} />
                <span className="text-xs text-gray-400">
                  {isRunning ? 'Active' : currentPhase === 'complete' ? 'Complete' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Card */}
        <div className="card bg-gray-800 border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📊</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-300">Progress</div>
                <div className="text-xs font-mono text-gray-400">
                  {Math.round(currentProgress)}%
                </div>
              </div>
              <ProgressBar 
                progress={currentProgress} 
                className="h-2 mb-1"
                animated={isRunning}
                showPercentage={false}
              />
              <div className="text-xs text-gray-400">
                {currentProgress === 100 ? 'Complete!' : isRunning ? 'In Progress...' : 'Waiting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Updates Count Card */}
        <div className="card bg-gray-800 border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📡</div>
            <div className="flex-1">
            <div className="text-sm text-gray-300">Live Updates</div>
              <div className="font-semibold text-white">
                {updates.length} Messages
              </div>
              {latestUpdate && (
                <div className="text-xs text-gray-400 mt-1 truncate">
                  Latest: {latestUpdate.message?.substring(0, 25)}...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Control Panel */}
      {isRunning && (
        <div className="bg-gray-800 border border-orange-600 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-orange-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
              <div className="font-medium text-orange-400 flex items-center">
                  <span className="mr-2">Agent is working...</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                <div className="text-sm text-orange-300">
                  {latestUpdate?.thinking || latestUpdate?.message || 'Processing your request'}
                </div>
                {/* Progress indicator */}
                <div className="flex items-center mt-1 text-xs text-orange-600">
                  <div className="w-20 bg-orange-200 rounded-full h-1 mr-2">
                    <div 
                      className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>
                  <span>{Math.round(currentProgress)}% complete</span>
                </div>
              </div>
            </div>
            
            {onAbort && (
              <button
                onClick={onAbort}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Process</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Completion Status */}
      {currentPhase === 'complete' && (
        <div className="bg-gray-800 border border-green-600 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="text-4xl animate-bounce">🎉</div>
            <div className="flex-1">
            <div className="font-semibold text-green-400 text-lg">Process Completed Successfully!</div>
            <div className="text-sm text-green-300 mt-1">
                Agent has finished processing your request. Check the results below.
              </div>
              
              {/* Completion stats */}
              {latestUpdate && (
                <div className="flex items-center space-x-4 mt-2 text-sm text-green-600">
                  <span>✅ 100% Complete</span>
                  <span>•</span>
                  <span>📊 {updates.length} Updates</span>
                  <span>•</span>
                  <span>⏱️ Process Finished</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Error Status */}
      {currentPhase === 'error' && (
        <div className="card bg-gray-800 border-red-600">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <div className="font-semibold text-red-400 text-lg">Process Failed</div>
              <div className="text-sm text-red-300 mt-1">
                {latestUpdate?.error || 'An unexpected error occurred during processing'}
              </div>
              
              {/* Error details */}
              {latestUpdate?.message && latestUpdate.message !== latestUpdate.error && (
                <div className="mt-2 p-2 bg-red-900/30 rounded text-xs text-red-300">
                  Details: {latestUpdate.message}
                </div>
              )}
              
              <div className="flex items-center space-x-2 mt-3">
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                  Retry Process
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Phase Progress Timeline */}
      {isRunning && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Process Timeline</h3>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-700"></div>
            </div>
            
            {/* Phase indicators */}
            {(['planning', 'discovery', 'research', 'generation', 'complete'] as AgentPhase[]).map((phase, index) => {
              const isActive = phase === currentPhase;
              const isCompleted = ['planning', 'discovery', 'research', 'generation'].indexOf(currentPhase) > index;
              
              return (
                <div key={phase} className="relative flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm z-10
                    ${isActive ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : 
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      'bg-gray-700 border-gray-600 text-gray-400'}
                  `}>
                    {isCompleted ? '✓' : phaseEmojis[phase]}
                  </div>
                  <div className={`
                    text-xs mt-2 text-center font-medium
                    ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-400'}
                  `}>
                    {phaseLabels[phase]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentWorkspace;