// src/components/agent/ProspectCard.tsx - ENHANCED WITH FULL DATA DISPLAY
import React, { useState } from 'react';
import { Prospect } from '@/lib/agent/types';

interface EnrichedProspect extends Prospect {
  emailType?: string;
  wordCount?: number;
  generatedAt?: string;
  research: {
    insights: string[];
    painPoints?: string[];
    opportunities?: string[];
    companyInfo?: any;
    fundingStage?: string;
    teamSize?: number;
  };
}

interface ProspectCardProps {
  prospect: EnrichedProspect;
}

const ProspectCard: React.FC<ProspectCardProps> = ({ prospect }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600 bg-green-100';
    if (confidence >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  // Copy email to clipboard
  const copyEmail = async () => {
    if (prospect.message?.body) {
      try {
        await navigator.clipboard.writeText(`Subject: ${prospect.message.subject}\n\n${prospect.message.body}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    }
  };
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
            {prospect.imageUrl ? (
              <img 
                src={prospect.imageUrl} 
                alt={prospect.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 text-xl font-bold">
                {prospect.name?.substring(0, 2).toUpperCase() || '??'}
              </div>
            )}
          </div>
        </div>
        
        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
            <h3 className="text-lg font-semibold text-white truncate">
            {prospect.name}
              </h3>
              <p className="text-sm text-gray-300">
                {prospect.role} at <span className="font-medium">{prospect.company}</span>
              </p>
              {prospect.location && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {prospect.location}
                </p>
              )}
            </div>
            
            {/* Confidence Score */}
            {(prospect.confidence || prospect.message?.confidence) && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prospect.confidence || prospect.message?.confidence || 0)}`}>
                {Math.round(prospect.confidence || prospect.message?.confidence || 0)}/10
              </div>
            )}
          </div>

          
          
          {/* Quick Preview */}
          <div className="mt-3 space-y-2">
            {prospect.message?.subject && (
              <div className="text-sm">
                <span className="text-gray-500">Subject:</span>
                <span className="ml-2 font-medium text-white">{prospect.message.subject}</span>
              </div>
            )}
            
            {prospect.message?.emailType && (
              <div className="text-sm">
                <span className="text-gray-500">Email Type:</span>
                <span className="ml-2 text-blue-600">{prospect.message.emailType}</span>
              </div>
            )}
          </div>
          
          {/* Links */}
          <div className="flex space-x-3 mt-3">
            {prospect.linkedInUrl && (
              <a 
                href={prospect.linkedInUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {prospect.companyUrl && (
              <a 
                href={prospect.companyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-800 text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
        
        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="sr-only">{expanded ? 'Collapse' : 'Expand'}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-6">
          
          {/* Research Insights */}
          {prospect.research && prospect.research.insights && prospect.research.insights.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Research Insights
              </h4>
              <div className="bg-gray-700 p-4 rounded-lg">
                <ul className="space-y-2">
                  {prospect.research.insights.slice(0, showFullEmail ? undefined : 3).map((insight, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-300">
                      <svg className="w-4 h-4 mt-0.5 mr-2 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {insight}
                    </li>
                  ))}
                </ul>
                
                {prospect.research.insights.length > 3 && !showFullEmail && (
                  <button
                    onClick={() => setShowFullEmail(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Show {prospect.research.insights.length - 3} more insights...
                  </button>
                )}
                
                {/* Additional research data */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {prospect.research.fundingStage && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Funding:</span>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full">{prospect.research.fundingStage}</span>
                    </div>
                  )}
                  {prospect.research.teamSize && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Team Size:</span>
                      <span className="ml-2 font-medium">{prospect.research.teamSize} people</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Personalized Email */}
          {prospect.message && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Personalized Cold Email
                </h4>
                
                <div className="flex items-center space-x-2">
                  {prospect.message.wordCount && (
                    <span className="text-xs text-gray-500">{prospect.message.wordCount} words</span>
                  )}
                  <button
                    onClick={copyEmail}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 border-l-4 border-green-500 p-4 rounded-r-lg">
                {/* Subject Line */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">SUBJECT:</div>
                  <div className="font-semibold text-white bg-gray-600 px-3 py-2 rounded border border-gray-500">
                    {prospect.message.subject}
                  </div>
                </div>
                
                {/* Email Body */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">MESSAGE:</div>
                  <div className="bg-white p-4 rounded border text-sm leading-relaxed whitespace-pre-line text-gray-800">
                    {prospect.message.body}
                  </div>
                </div>
                
                {/* Personalization Highlights */}
                {prospect.message.personalization && prospect.message.personalization.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">PERSONALIZATION ELEMENTS:</div>
                    <div className="flex flex-wrap gap-2">
                      {prospect.message.personalization.map((item, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                        >
                          ✨ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Email Metadata */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {prospect.message.emailType && (
                    <span className="capitalize">Type: {prospect.message.emailType.replace('_', ' ')}</span>
                  )}
                  {prospect.message.confidence && (
                    <span>Confidence: {Math.round(prospect.message.confidence)}/10</span>
                  )}
                </div>
                {prospect.generatedAt && (
                  <span>Generated: {new Date(prospect.generatedAt).toLocaleTimeString()}</span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
              <button 
  onClick={() => {
    const email = prospect.email || (() => {
      const name = prospect.name.split(' ')[0];
      const domain = prospect?.companyUrl
        ?.replace(/https?:\/\//, '')
        ?.replace(/^www\./, '');
      return `${name}@${domain}`;
    })();
    const subject = encodeURIComponent(prospect.message?.subject || '');
    const body = encodeURIComponent(prospect.message?.body || '');
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  }}
  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
>
  ✅ Approve & Send
</button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                  ✏️ Edit Message
                </button>
                <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium text-sm">
                  ⏳ Schedule
                </button>
              </div>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{prospect.message?.personalization?.length || 0}</div>
              <div className="text-xs text-gray-500">Personal Hooks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{prospect.research?.insights?.length || 0}</div>
              <div className="text-xs text-gray-500">Research Points</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{prospect.message?.wordCount || 0}</div>
              <div className="text-xs text-gray-500">Word Count</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{Math.round(prospect.confidence || prospect.message?.confidence || 0)}</div>
              <div className="text-xs text-gray-500">Confidence</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectCard;