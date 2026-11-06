import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Calendar, Award, Target, Users, Briefcase } from 'lucide-react';
import { InterviewResult } from '../types';

interface DashboardProps {
  results: InterviewResult[];
  onRetakeStep: (stepId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ results, onRetakeStep }) => {
  const [serverAttempts, setServerAttempts] = useState<InterviewResult[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.email) return;
    (async () => {
      try {
        const res = await fetch(`/api/attempts/${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: InterviewResult[] = (data.attempts || []).map((a: any) => ({
            stepId: a.step_id,
            score: Math.round(a.score),
            feedback: a.feedback || '',
            strengths: a.strengths || [],
            improvements: a.improvements || [],
            completedAt: a.completed_at ? new Date(a.completed_at) : new Date(),
          }));
          setServerAttempts(mapped);
        }
      } catch (e) {
        console.error('Failed to fetch attempts', e);
      }
    })();
  }, []);
  const allResults = [...serverAttempts, ...results];
  const overallScore = allResults.length > 0 
    ? Math.round(allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  const stepIcons = {
    'aptitude': Target,
    'group-discussion': Users,
    'hr-interview': Briefcase,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Interview Dashboard</h2>
            <p className="text-gray-600">Track your progress and improve your performance</p>
          </div>
          <div className={`bg-gradient-to-r ${getScoreGradient(overallScore)} text-white p-6 rounded-xl text-center shadow-lg`}>
            <Trophy className="w-8 h-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{overallScore}%</div>
            <div className="text-sm opacity-90">Overall Score</div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Progress</h3>
                <p className="text-2xl font-bold text-blue-600">{allResults.length}/3</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Steps Completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Best Score</h3>
                <p className="text-2xl font-bold text-green-600">
                  {allResults.length > 0 ? Math.max(...allResults.map(r => r.score)) : 0}%
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Highest Achievement</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Last Attempt</h3>
                <p className="text-sm font-bold text-purple-600">
                  {allResults.length > 0 
                    ? new Date(Math.max(...allResults.map(r => r.completedAt.getTime()))).toLocaleDateString()
                    : 'Not started'
                  }
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Recent Activity</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Target</h3>
                <p className="text-2xl font-bold text-orange-600">85%</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Goal Score</p>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Step Performance</h3>
            <div className="space-y-4">
              {[
                { id: 'aptitude', title: 'Aptitude Test', description: 'Logical reasoning and problem solving' },
                { id: 'group-discussion', title: 'Group Discussion', description: 'Communication and teamwork skills' },
                { id: 'hr-interview', title: 'HR Interview', description: 'Behavioral and soft skills assessment' },
              ].map((step) => {
                const result = allResults.find(r => r.stepId === step.id);
                const IconComponent = stepIcons[step.id as keyof typeof stepIcons];
                
                return (
                  <div key={step.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <IconComponent className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result ? (
                        <>
                          <div className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </div>
                          <button
                            onClick={() => onRetakeStep(step.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Retake
                          </button>
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm">Not completed</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Performance Insights</h3>
            
            {allResults.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-3">Strengths</h4>
                  <div className="space-y-2">
                    {allResults.flatMap(r => r.strengths).slice(0, 3).map((strength, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-orange-700 mb-3">Areas for Improvement</h4>
                  <div className="space-y-2">
                    {allResults.flatMap(r => r.improvements).slice(0, 3).map((improvement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Focus on your weakest area</li>
                    <li>• Practice mock interviews daily</li>
                    <li>• Review company-specific questions</li>
                    <li>• Work on communication skills</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Complete your first interview step to see insights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};