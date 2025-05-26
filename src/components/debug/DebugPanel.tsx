// src/components/debug/DebugPanel.tsx - TEMPORARY DEBUG COMPONENT
import React, { useState } from 'react';
import { AgentUpdate, Prospect } from '@/lib/agent/types';

interface DebugPanelProps {
  updates: AgentUpdate[];
  prospects: Prospect[];
  currentPhase: string;
  isRunning: boolean;
  error: string | null;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  updates, 
  prospects, 
  currentPhase, 
  isRunning, 
  error 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  const latestUpdate = updates[updates.length - 1];
  const finalUpdate = updates.find(u => u.type === 'data' && u.results);

  return (
    <div className="card bg-gray-900 text-green-400 font-mono text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-sans text-sm">🐛 Debug Panel</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-yellow-400 hover:text-yellow-300"
        >
          {expanded ? '⬇️ Collapse' : '⬆️ Expand'}
        </button>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-blue-400">Phase</div>
          <div>{currentPhase}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-green-400">Running</div>
          <div>{isRunning ? 'Yes' : 'No'}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-purple-400">Updates</div>
          <div>{updates.length}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-orange-400">Prospects</div>
          <div>{prospects.length}</div>
        </div>
      </div>

      {expanded && (
        <div>
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4">
            {['overview', 'updates', 'prospects', 'raw'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1 rounded text-xs ${
                  selectedTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-800 p-3 rounded max-h-64 overflow-y-auto">
            
            {selectedTab === 'overview' && (
              <div className="space-y-2">
                <div><span className="text-blue-400">Current Phase:</span> {currentPhase}</div>
                <div><span className="text-green-400">Is Running:</span> {isRunning ? 'Yes' : 'No'}</div>
                <div><span className="text-purple-400">Total Updates:</span> {updates.length}</div>
                <div><span className="text-orange-400">Total Prospects:</span> {prospects.length}</div>
                <div><span className="text-red-400">Error:</span> {error || 'None'}</div>
                
                {latestUpdate && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-yellow-400 mb-2">Latest Update:</div>
                    <div><span className="text-blue-400">Type:</span> {latestUpdate.type}</div>
                    <div><span className="text-green-400">Phase:</span> {latestUpdate.phase}</div>
                    <div><span className="text-purple-400">Message:</span> {latestUpdate.message}</div>
                    <div><span className="text-orange-400">Progress:</span> {latestUpdate.progress || 'N/A'}</div>
                    {latestUpdate.results && (
                      <div><span className="text-red-400">Results Count:</span> {latestUpdate.results.prospects?.length}</div>
                    )}
                  </div>
                )}

                {finalUpdate && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-yellow-400 mb-2">Final Update with Results:</div>
                    <div><span className="text-green-400">Found:</span> Yes</div>
                    <div><span className="text-purple-400">Results:</span> {finalUpdate.results?.prospects?.length || 0} items</div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'updates' && (
              <div className="space-y-2">
                {updates.length === 0 ? (
                  <div className="text-gray-400">No updates yet</div>
                ) : (
                  updates.slice(-10).map((update, index) => (
                    <div key={index} className="border-b border-gray-700 pb-2 mb-2">
                      <div className="flex justify-between">
                        <span className="text-blue-400">{update.type}</span>
                        <span className="text-green-400">{update.phase}</span>
                      </div>
                      <div className="text-gray-300">{update.message}</div>
                      {update.progress && (
                        <div className="text-purple-400">Progress: {update.progress}%</div>
                      )}
                      {update.results && (
                        <div className="text-orange-400">Results: {update.results.prospects?.length || 0} items</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedTab === 'prospects' && (
              <div className="space-y-2">
                {prospects.length === 0 ? (
                  <div className="text-gray-400">No prospects yet</div>
                ) : (
                  prospects.map((prospect, index) => (
                    <div key={index} className="border-b border-gray-700 pb-2 mb-2">
                      <div className="text-blue-400">Prospect {index + 1}:</div>
                      <div><span className="text-green-400">Name:</span> {prospect.name || 'N/A'}</div>
                      <div><span className="text-purple-400">Company:</span> {prospect.company || 'N/A'}</div>
                      <div><span className="text-orange-400">Email Subject:</span> {prospect.message?.subject || 'N/A'}</div>
                      <div><span className="text-red-400">Has Email Body:</span> {prospect.message?.body ? 'Yes' : 'No'}</div>
                      <div><span className="text-yellow-400">Research Points:</span> {prospect.research?.insights?.length || 0}</div>
                      <div><span className="text-cyan-400">Confidence:</span> {prospect.confidence || 'N/A'}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedTab === 'raw' && (
              <div>
                <div className="text-yellow-400 mb-2">Raw Prospects Data:</div>
                <pre className="text-xs whitespace-pre-wrap text-gray-300">
                  {JSON.stringify(prospects, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;