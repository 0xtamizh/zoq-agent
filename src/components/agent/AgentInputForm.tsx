// src/components/agent/AgentInputForm.tsx - UPDATED WITH EXAMPLE QUERY SUPPORT

import React, { useState, useEffect } from 'react';
import { AgentInput } from '@/lib/agent/types';

interface AgentInputFormProps {
  onSubmit: (input: AgentInput) => void;
  isLoading: boolean;
  onResults: (results: any) => void;
  onError: (error: string) => void;
  hasStarted: boolean;
  selectedQuery?: string;           // NEW PROP
  onQueryChange?: (query: string) => void; // NEW PROP
}

export default function AgentInputForm({ 
  onSubmit, 
  isLoading, 
  onResults, 
  onError, 
  hasStarted,
  selectedQuery = '',              // NEW PROP
  onQueryChange                    // NEW PROP
}: AgentInputFormProps) {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: Update local query when selectedQuery changes
  useEffect(() => {
    if (selectedQuery && selectedQuery !== query) {
      setQuery(selectedQuery);
      // Clear the selectedQuery after setting it
      if (onQueryChange) {
        onQueryChange('');
      }
    }
  }, [selectedQuery, query, onQueryChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const agentInput: AgentInput = {
        query: query.trim(),
      };
      
      onSubmit(agentInput);
      
      // Clear the form after successful submission
      setQuery('');
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      onError(error.message || 'Failed to submit query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Clear selectedQuery when user starts typing manually
    if (onQueryChange && selectedQuery) {
      onQueryChange('');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <textarea
            value={query}
            onChange={handleQueryChange}
            placeholder="Describe what you need... For example: 'Find AI startup founders in San Francisco and write cold emails about our new tool. I'm John from TechCorp and we help companies automate their sales process.'"
            className="w-full min-h-[120px] p-4 bg-neutral-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading || isSubmitting}
            required
            maxLength={2000}
          />
          
          {/* Character count */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {query.length}/2000
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!query.trim() || isLoading || isSubmitting}
            className={`
              px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-200
              ${!query.trim() || isLoading || isSubmitting
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isLoading || isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <span>Find Prospects & Generate Emails</span>
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="text-center text-sm text-gray-400">
          <p>💡 Include your name, company, and what you're offering for best results</p>
        </div>
      </form>
    </div>
  );
}