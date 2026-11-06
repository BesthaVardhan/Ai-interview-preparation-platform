import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { InterviewStep } from '../types';

interface InterviewProgressProps {
  steps: InterviewStep[];
  currentStep: number;
}

export const InterviewProgress: React.FC<InterviewProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Interview Progress</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : index === currentStep ? (
                <Clock className="w-6 h-6 text-blue-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${
                step.completed ? 'text-green-700' : 
                index === currentStep ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-600">{step.description}</p>
              {step.score && (
                <div className="mt-1">
                  <span className="text-sm font-medium text-blue-600">
                    Score: {step.score}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};