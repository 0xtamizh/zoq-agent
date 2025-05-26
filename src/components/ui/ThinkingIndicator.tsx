import React from 'react';

interface ThinkingIndicatorProps {
  text?: string;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ text }) => {
  return (
    <div className="flex items-center my-2">
      <div className="mr-2 text-gray-600 italic">
        {text || 'Thinking'}
        <span className="thinking-dot bg-gray-600 ml-1"></span>
        <span className="thinking-dot bg-gray-600"></span>
        <span className="thinking-dot bg-gray-600"></span>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
