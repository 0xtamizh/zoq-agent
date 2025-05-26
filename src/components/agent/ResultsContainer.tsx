// src/components/agent/ResultsContainer.tsx - ENHANCED WITH DEBUG INFO
import React from 'react';
import { Prospect } from './types';
import ProspectCard from './ProspectCard';

interface ResultsContainerProps {
  prospects: Prospect[];
  isLoading: boolean;
}

const ResultsContainer: React.FC<ResultsContainerProps> = ({ prospects, isLoading }) => {
  // Debug logging
  console.log('🎯 ResultsContainer: Rendering with', {
    prospectsCount: prospects.length,
    isLoading,
    prospects: prospects.length > 0 ? prospects[0] : 'none'
  });

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-16 w-16 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
        <p className="text-gray-500 mt-4">Loading prospects...</p>
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-white">No prospects yet</h3>
        <p className="mt-1 text-sm text-gray-400">
          Run the ZOQ Agent to discover and research prospects.
        </p>
        
        {/* Debug info in development */}
        
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold flex items-center text-white">
          <span className="mr-2">🎯</span>
          Prospects ({prospects.length})
        </h2>
        
       
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{prospects.length}</div>
            <div className="text-sm text-gray-300">Total Prospects</div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {prospects.filter(p => p.message && p.message.body).length}
            </div>
            <div className="text-sm text-gray-300">With Emails</div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {prospects.filter(p => p.research && p.research.insights && p.research.insights.length > 0).length}
            </div>
            <div className="text-sm text-gray-300">With Research</div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {prospects.length > 0 
                ? Math.round(prospects.reduce((sum, p) => sum + (p.confidence || 0), 0) / prospects.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-300">Avg Confidence</div>
          </div>
        </div>
      </div>
   
      
      {/* Prospects Grid */}
      <div className="grid grid-cols-1 gap-4">
        {prospects.map((prospect, index) => {
          // Add extra logging for each prospect
          console.log(`🔍 Rendering prospect ${index}:`, {
            name: prospect.name,
            company: prospect.company,
            hasMessage: !!prospect.message,
            hasSubject: !!prospect.message?.subject,
            hasBody: !!prospect.message?.body,
            hasResearch: !!prospect.research,
            insightsCount: prospect.research?.insights?.length || 0
          });
          
          return (
            <ProspectCard 
              key={prospect.id || `prospect-${index}`} 
              prospect={prospect} 
            />
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
        <p>💡 Click on any prospect card to expand and see the full personalized email and research insights.</p>
      </div>
    </div>
  );
};

export default ResultsContainer;