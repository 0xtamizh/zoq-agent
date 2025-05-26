// src/components/ui/ProgressBar.tsx - ENHANCED WITH SMOOTH ANIMATION
import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  animated?: boolean;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '', 
  animated = true,
  showPercentage = false 
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  
  useEffect(() => {
    if (!animated) {
      setCurrentProgress(progress);
      return;
    }
    
    // Smooth animation from current to target progress
    const startProgress = currentProgress;
    const targetProgress = Math.min(Math.max(progress, 0), 100);
    const difference = targetProgress - startProgress;
    
    if (Math.abs(difference) < 1) {
      setCurrentProgress(targetProgress);
      return;
    }
    
    // Animation duration based on distance (more distance = longer animation)
    const duration = Math.min(Math.abs(difference) * 50, 2000); // Max 2 seconds
    const steps = Math.abs(difference);
    const stepDuration = duration / steps;
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const increment = difference > 0 ? 1 : -1;
      const newProgress = startProgress + (step * increment);
      
      setCurrentProgress(newProgress);
      
      if (step >= steps) {
        setCurrentProgress(targetProgress);
        clearInterval(interval);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [progress, animated, currentProgress]);
  
  const progressPercentage = Math.min(Math.max(currentProgress, 0), 100);
  
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out relative"
        style={{ width: `${progressPercentage}%` }}
      >
        {/* Animated shine effect */}
        {animated && progressPercentage > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
        )}
      </div>
      
      {/* Percentage display */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;