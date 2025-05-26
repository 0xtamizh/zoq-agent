// src/components/agent/RealTimeStatusDisplay.tsx - ENHANCED WITH SMOOTH ANIMATIONS
import React, { useEffect, useRef } from 'react';
import { AgentPhase, AgentUpdate } from '../../lib/agent/types';

interface RealTimeStatusDisplayProps {
  updates: AgentUpdate[];
  currentPhase: AgentPhase;
  isRunning: boolean;
}

const phaseColors: Record<AgentPhase, string> = {
  planning: 'text-blue-600',
  discovery: 'text-purple-600',
  research: 'text-green-600',
  generation: 'text-orange-600',
  complete: 'text-green-700',
  error: 'text-red-600',
  enrichment: 'text-teal-600',
  email: 'text-indigo-600',
  idle: 'text-gray-500'
};

const phaseBackgrounds: Record<AgentPhase, string> = {
  planning: 'bg-blue-50 border-blue-200',
  discovery: 'bg-purple-50 border-purple-200',
  research: 'bg-green-50 border-green-200',
  generation: 'bg-orange-50 border-orange-200',
  complete: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  enrichment: 'bg-teal-50 border-teal-200',
  email: 'bg-indigo-50 border-indigo-200',
  idle: 'bg-gray-50 border-gray-200'
};

const RealTimeStatusDisplay: React.FC<RealTimeStatusDisplayProps> = ({
  updates,
  currentPhase,
  isRunning
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  const latestUpdate = updates[updates.length - 1];

  // Auto-scroll to bottom when new updates arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [updates]);

  // Group updates by phase for better display
  const groupedUpdates = updates.reduce((groups: Record<string, AgentUpdate[]>, update) => {
    const phase = update.phase || 'unknown';
    if (!groups[phase]) {
      groups[phase] = [];
    }
    groups[phase].push(update);
    return groups;
  }, {});

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getUpdateIcon = (update: AgentUpdate) => {
    if (update.type === 'error') return '❌';
    if (update.phase === 'complete') return '✅';
    if (update.progress === 100) return '🎉';
    if (update.progress && update.progress > 0) return '📊';
    return '📝';
  };

  const getProgressBar = (progress: number) => {
    const percentage = Math.max(0, Math.min(100, progress));
    return (
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (updates.length === 0) {
    return (
      <div className="card bg-gray-50 border-gray-200">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-sm text-gray-500">Waiting for agent to start...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status Header */}
      <div className="card border-2 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              w-4 h-4 rounded-full 
              ${isRunning ? 'bg-green-500 animate-pulse' : currentPhase === 'complete' ? 'bg-green-500' : 'bg-gray-400'}
            `} />
            <div>
              <h3 className="font-semibold text-gray-300">
                Agent Status
              </h3>
              <p className="text-sm text-gray-500">
                {latestUpdate?.message || 'Processing...'}
              </p>
            </div>
          </div>
          
          {/* Current phase indicator */}
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 border border-gray-700">
            {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
          </div>
        </div>
        
        {/* Progress for current phase */}
        {latestUpdate?.progress !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-mono">{Math.round(latestUpdate.progress)}%</span>
            </div>
            {getProgressBar(latestUpdate.progress)}
          </div>
        )}
      </div>

      {/* Live Updates Terminal */}
      <div className="card bg-gray-900 text-green-400 font-mono text-sm overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white text-sm font-sans">Live Updates</div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div 
          ref={logRef}
          className="h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-800"
        >
          {updates.slice(-20).map((update, index) => (
            <div 
              key={`${update.timestamp}-${index}`}
              className="flex items-start space-x-2 animate-fadeIn"
            >
              {/* Timestamp */}
              <span className="text-green-600 text-xs shrink-0">
                {formatTime(update.timestamp||Date.now())}
              </span>
              
              {/* Phase tag */}
              <span className={`
                text-xs px-2 py-0.5 rounded uppercase font-bold shrink-0
                ${update.phase === 'complete' ? 'text-green-400' : 
                  update.phase === 'error' ? 'text-red-400' : 
                  'text-blue-400'}
              `}>
                [{update.phase}]
              </span>
              
              {/* Message */}
              <span className="text-gray-300 flex-1 text-xs">
                {update.message}
              </span>
              
              {/* Progress indicator */}
              {update.progress !== undefined && (
                <span className="text-yellow-400 text-xs shrink-0">
                  {Math.round(update.progress)}%
                </span>
              )}
            </div>
          ))}
          
          {/* Cursor for active state */}
          {isRunning && (
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-xs">
                {formatTime(Date.now())}
              </span>
              <span className="text-blue-400 text-xs px-2 py-0.5 rounded uppercase font-bold">
                [{currentPhase}]
              </span>
              <span className="text-gray-300 text-xs">
                <span className="animate-pulse">▋</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Process Timeline */}
      <div className="card bg-gray-900">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Process Timeline</h4>
        <div className="space-y-2">
          {Object.entries(groupedUpdates).map(([phase, phaseUpdates]) => {
            const isCurrentPhase = phase === currentPhase;
            const latestPhaseUpdate = phaseUpdates[phaseUpdates.length - 1];
            const isCompleted = latestPhaseUpdate?.progress === 100 || 
                              (phase !== currentPhase && currentPhase !== 'idle');
            
            return (
              <div key={phase} className="flex items-center space-x-3">
                {/* Phase indicator */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${isCurrentPhase ? 'bg-blue-500 text-white animate-pulse' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-500'}
                `}>
                  {isCompleted ? '✓' : getUpdateIcon(latestPhaseUpdate)}
                </div>
                
                {/* Phase info */}
                <div className="flex-1">
                  <div className={`
                    text-sm font-medium
                    ${isCurrentPhase ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'}
                  `}>
                    {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                  </div>
                  <div className="text-xs text-gray-500">
                    {latestPhaseUpdate?.message || 'Pending...'}
                  </div>
                </div>
                
                {/* Progress */}
                {latestPhaseUpdate?.progress !== undefined && (
                  <div className="text-xs text-gray-500 font-mono">
                    {Math.round(latestPhaseUpdate.progress)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RealTimeStatusDisplay;

// Add fadeIn animation to CSS
const style = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-thumb-green-600::-webkit-scrollbar-thumb {
    background-color: #059669;
  }
  
  .scrollbar-track-gray-800::-webkit-scrollbar-track {
    background-color: #1f2937;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}