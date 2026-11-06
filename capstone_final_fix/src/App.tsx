import React, { useState, useEffect } from 'react';
import { Brain, Users, UserCheck, Building2, ChevronRight, Star, CheckCircle, Play, LogOut, MessageCircle, FileText } from 'lucide-react';
import { InterviewStep, InterviewResult } from './types';
import { InterviewProgress } from './components/InterviewProgress';
import { AptitudeTest } from './components/AptitudeTest';
import { GroupDiscussion } from './components/GroupDiscussion';
import { HRInterview } from './components/HRInterview';
import { CompanyQuestions } from './components/CompanyQuestions';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';

interface User {
  email: string;
  name: string;
}

import { ResumeAnalysis } from './components/ResumeAnalysis';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'aptitude' | 'group-discussion' | 'hr-interview' | 'company-questions' | 'dashboard' | 'resume-analysis'>('home');
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<InterviewResult[]>([]);
  
  const [steps, setSteps] = useState<InterviewStep[]>([
    {
      id: 'aptitude',
      title: 'Aptitude Test',
      description: 'Logical reasoning and problem-solving assessment with video recording',
      completed: false
    },
    {
      id: 'group-discussion',
      title: 'Group Discussion',
      description: 'Interactive discussion with AI participants and live evaluation',
      completed: false
    },
    {
      id: 'hr-interview',
      title: 'HR Round',
      description: 'One-on-one interview with AI HR and performance analysis',
      completed: false
    }
  ]);

  // Check for existing user session on app load
  useEffect(() => {
    // Always clear any saved user session to force login on every visit
    localStorage.removeItem('user');
    setUser(null);
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Save user session to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('home');
    // Reset application state
    setCurrentStep(0);
    setResults([]);
    setSteps(prev => prev.map(step => ({ ...step, completed: false, score: undefined, feedback: undefined })));
  };

  const handleStepComplete = async (stepId: string, score: number) => {
    const newResult: InterviewResult = {
      stepId,
      score,
      feedback: generateFeedback(score),
      strengths: generateStrengths(stepId, score),
      improvements: generateImprovements(stepId, score),
      completedAt: new Date()
    };

    setResults(prev => [...prev.filter(r => r.stepId !== stepId), newResult]);

    // Persist attempt to backend
    try {
      if (user?.email) {
        await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: user.email,
            step_id: stepId,
            score,
            feedback: newResult.feedback,
            strengths: newResult.strengths,
            improvements: newResult.improvements,
            completed_at: newResult.completedAt.toISOString(),
          })
        });
      }
    } catch (e) {
      console.error('Failed to save attempt', e);
    }
    
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed: true, score, feedback: newResult.feedback }
        : step
    ));

    // Move to next step or dashboard
    const nextStepIndex = steps.findIndex(step => step.id === stepId) + 1;
    if (nextStepIndex < steps.length && !steps[nextStepIndex].completed) {
      setCurrentStep(nextStepIndex);
      setCurrentView(steps[nextStepIndex].id as any);
    } else {
      setCurrentView('dashboard');
    }
  };

  const generateFeedback = (score: number): string => {
    if (score >= 80) return "Excellent performance! You demonstrated strong skills and confidence.";
    if (score >= 60) return "Good job! There are some areas for improvement, but overall well done.";
    return "Keep practicing! Focus on the areas highlighted for improvement.";
  };

  const generateStrengths = (stepId: string, score: number): string[] => {
    const commonStrengths = {
      aptitude: ['Logical thinking', 'Problem-solving approach', 'Quick analysis'],
      'group-discussion': ['Active participation', 'Clear communication', 'Team collaboration'],
      'hr-interview': ['Professional demeanor', 'Structured responses', 'Confidence']
    };
    
    return commonStrengths[stepId as keyof typeof commonStrengths] || [];
  };

  const generateImprovements = (stepId: string, score: number): string[] => {
    const commonImprovements = {
      aptitude: ['Time management', 'Accuracy improvement', 'Formula application'],
      'group-discussion': ['Speaking time balance', 'Counter-arguments', 'Leadership skills'],
      'hr-interview': ['Specific examples', 'Body language', 'Question clarity']
    };
    
    return commonImprovements[stepId as keyof typeof commonImprovements] || [];
  };

  const startStep = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    console.log('startStep called with:', stepId, 'found index:', stepIndex);
    setCurrentStep(stepIndex);
    setCurrentView(stepId as any);
  };


  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Main application content for authenticated users
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            {/* User Welcome Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user.name}!</h2>
                <p className="text-gray-600">Ready to practice your interview skills?</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 text-gray-700 hover:bg-white transition-all shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">AI-Powered Interview Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Master Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Interview Skills</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Practice with our advanced AI system that simulates real interview scenarios. 
                Get instant feedback, improve your performance, and land your dream job.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => startStep('aptitude')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Interview Practice
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-200"
                >
                  View Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('resume-analysis')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Resume Analysis
                </button>
              </div>
            </div>

            {/* Main Interview Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  icon: Brain,
                  title: 'Aptitude Test',
                  description: 'Logical reasoning and problem-solving assessment with video recording',
                  color: 'from-blue-500 to-cyan-500',
                  bgColor: 'bg-blue-50'
                },
                {
                  icon: Users,
                  title: 'Group Discussion',
                  description: '3 AI participants with voice interaction and live performance evaluation',
                  color: 'from-purple-500 to-pink-500',
                  bgColor: 'bg-purple-50'
                },
                {
                  icon: UserCheck,
                  title: 'HR Interview',
                  description: 'One-on-one with AI HR interviewer using voice interaction and realistic feedback',
                  color: 'from-green-500 to-emerald-500',
                  bgColor: 'bg-green-50'
                }
              ].map((step, index) => {
                const stepData = steps[index];
                const Icon = step.icon;
                
                return (
                  <div
                    key={step.title}
                    className={`${step.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group relative overflow-hidden`}
                    onClick={() => startStep(stepData.id)}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-300" />
                    <div className="relative">
                      <div className={`bg-gradient-to-r ${step.color} p-4 rounded-xl inline-block mb-4 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{step.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {stepData.completed ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm font-medium text-green-700">
                                {stepData.score}%
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Not started</span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Company Questions Section */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-8 shadow-xl mb-16">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Company-Specific Questions</h3>
                    <p className="text-gray-600 text-lg">
                      Practice with real questions from Google, Microsoft, Amazon, Apple, Meta, Netflix, and Tesla. 
                      Each company has aptitude, technical, and behavioral questions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('company-questions')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Practice Now</span>
                </button>
              </div>
            </div>


            {/* Features Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl">
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
                Why Choose Our AI Interview Platform?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Realistic AI Interactions',
                    description: 'Experience natural conversations with advanced AI that adapts to your responses',
                    icon: '🤖'
                  },
                  {
                    title: 'Real-time Feedback',
                    description: 'Get instant evaluation and suggestions to improve your performance',
                    icon: '⚡'
                  },
                  {
                    title: 'Comprehensive Analysis',
                    description: 'Detailed performance metrics and personalized improvement recommendations',
                    icon: '📊'
                  }
                ].map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('home')}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              AI Interview Prep
            </button>
            <nav className="flex items-center space-x-6">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={() => setCurrentView('company-questions')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Company Questions
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="py-8">
        {currentView !== 'dashboard' && currentView !== 'company-questions' && (
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <InterviewProgress steps={steps} currentStep={currentStep} />
          </div>
        )}

        {currentView === 'aptitude' && (
          <AptitudeTest onComplete={(score) => handleStepComplete('aptitude', score)} />
        )}
        
        {currentView === 'group-discussion' && (
          steps.find(s => s.id === 'group-discussion') ?
            <GroupDiscussion onComplete={(score) => handleStepComplete('group-discussion', score)} /> :
            <div className="p-8 text-center text-red-600 font-bold">Group Discussion step not found. Please check your steps configuration.</div>
        )}
        
        {currentView === 'hr-interview' && (
          <HRInterview onComplete={(score) => handleStepComplete('hr-interview', score)} />
        )}
        
        {currentView === 'company-questions' && (
          <CompanyQuestions onComplete={() => setCurrentView('home')} />
        )}
        
        {currentView === 'dashboard' && (
          <Dashboard results={results} onRetakeStep={startStep} />
        )}
        
        {currentView === 'resume-analysis' && user && (
          <ResumeAnalysis userEmail={user.email} />
        )}
      </div>

    </div>
  );
}

export default App;

