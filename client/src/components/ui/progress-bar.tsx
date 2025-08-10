import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Badge } from './badge';
import type { VersionProgress } from '@shared/progress-utils';

interface ProgressBarProps {
  progress: VersionProgress;
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const { percentage, completionStatus } = progress;
  
  const getProgressColor = () => {
    // Special styling for production releases
    if (completionStatus === 'production_deployed') {
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    }
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusBadge = () => {
    // Special badge for production releases
    if (completionStatus === 'production_deployed') {
      return (
        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 dark:bg-gradient-to-r dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-200 dark:border-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          🚀 Déployé en production
        </Badge>
      );
    }
    
    if (completionStatus === 'preprod_finalized') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pré-production finalisée
        </Badge>
      );
    } else if (completionStatus === 'recette_finalized') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Recette finalisée
        </Badge>
      );
    }
    return null; // Ne plus afficher "En cours"
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="relative w-full h-7 bg-gray-200 dark:bg-gray-700 rounded-full overflow-visible">
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-full ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* 80% Marker */}
        <div className="absolute left-[80%] top-0 h-full w-1 bg-blue-600 dark:bg-blue-400 rounded">
          <div className="absolute -top-7 -left-12 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
            80% Préprod
          </div>
        </div>
        
        {/* 100% Marker */}
        <div className="absolute right-0 top-0 h-full w-1 bg-green-600 dark:bg-green-400 rounded">
          <div className="absolute -top-7 -left-10 text-xs font-bold text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
            100% Prod
          </div>
        </div>
        
        {/* Progress Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            {percentage}%
          </span>
        </div>
      </div>
      
      {/* Status Badge removed as requested */}
    </div>
  );
}