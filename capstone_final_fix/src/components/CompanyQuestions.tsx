import React, { useState } from 'react';
import { Building2, Star, BookOpen, Target, TrendingUp, ChevronRight, Clock, Users, Award, Search, Monitor, Package, Apple, Facebook, Film, Zap, Globe, Cloud, Car, Layers, Circle, Square, Triangle, Hexagon } from 'lucide-react';
import { CompanyQuestions as CompanyQuestionsType } from '../types';

const companyData: CompanyQuestionsType[] = [
  {
    companyName: 'Google',
    logo: 'search',
    questions: {
      aptitude: [
        {
          id: 'g1',
          question: 'How many golf balls can fit in a school bus?',
          options: ['500,000', '1,000,000', '1,500,000', '2,000,000'],
          correctAnswer: 1,
          explanation: 'This is an estimation question. Consider the volume of a school bus vs. a golf ball.',
          difficulty: 'hard'
        },
        {
          id: 'g2',
          question: 'You have 1000 bottles of wine, one of which is poisoned. You have 10 test strips. How do you find the poisoned bottle?',
          options: ['Use binary search', 'Use binary representation', 'Test randomly', 'Cannot be solved'],
          correctAnswer: 1,
          explanation: 'Use binary representation. Each test strip represents a bit position.',
          difficulty: 'hard'
        }
      ],
      technical: [
        {
          id: 'g3',
          question: 'Explain the difference between supervised and unsupervised learning.',
          category: 'technical',
          expectedPoints: ['Definition differences', 'Use cases', 'Examples', 'Advantages/disadvantages']
        },
        {
          id: 'g4',
          question: 'How would you design a URL shortener like bit.ly?',
          category: 'technical',
          expectedPoints: ['Database design', 'Encoding algorithm', 'Scalability', 'Caching strategy']
        }
      ],
      behavioral: [
        {
          id: 'g5',
          question: 'Tell me about a time when you had to work with a difficult team member.',
          category: 'behavioral',
          expectedPoints: ['Situation', 'Actions taken', 'Communication approach', 'Resolution']
        },
        {
          id: 'g6',
          question: 'Describe a project where you had to learn something completely new.',
          category: 'behavioral',
          expectedPoints: ['Learning approach', 'Challenges faced', 'Resources used', 'Final outcome']
        }
      ]
    }
  },
  {
    companyName: 'Microsoft',
    logo: 'squares',
    questions: {
      aptitude: [
        {
          id: 'm1',
          question: 'If you have 8 balls and one is heavier than the others, how do you find it in 2 weighings?',
          options: ['Divide into 3 groups', 'Divide into 2 groups', 'Weigh individually', 'Cannot be done'],
          correctAnswer: 0,
          explanation: 'Divide into groups of 3, 3, and 2. Use binary search logic.',
          difficulty: 'hard'
        },
        {
          id: 'm2',
          question: 'How many piano tuners are there in Chicago?',
          options: ['50-100', '100-200', '200-300', '300-500'],
          correctAnswer: 1,
          explanation: 'Fermi estimation: Population, piano ownership rate, tuning frequency.',
          difficulty: 'medium'
        }
      ],
      technical: [
        {
          id: 'm3',
          question: 'Explain the difference between a process and a thread.',
          category: 'technical',
          expectedPoints: ['Memory space', 'Communication', 'Creation overhead', 'Context switching']
        },
        {
          id: 'm4',
          question: 'How would you implement a LRU cache?',
          category: 'technical',
          expectedPoints: ['Data structures used', 'Time complexity', 'Space complexity', 'Implementation details']
        }
      ],
      behavioral: [
        {
          id: 'm5',
          question: 'Tell me about a time you failed and what you learned from it.',
          category: 'behavioral',
          expectedPoints: ['Specific failure', 'Analysis of causes', 'Lessons learned', 'Applied improvements']
        },
        {
          id: 'm6',
          question: 'How do you handle competing priorities?',
          category: 'behavioral',
          expectedPoints: ['Prioritization framework', 'Communication strategy', 'Time management', 'Examples']
        }
      ]
    }
  },
  {
    companyName: 'Amazon',
    logo: 'arrow',
    questions: {
      aptitude: [
        {
          id: 'a1',
          question: 'How would you move Mount Fuji?',
          options: ['Use explosives', 'Move it piece by piece', 'Question the premise', 'Use advanced technology'],
          correctAnswer: 2,
          explanation: 'This tests creative thinking and questioning assumptions.',
          difficulty: 'hard'
        },
        {
          id: 'a2',
          question: 'Estimate the number of windows in New York City.',
          options: ['10 million', '100 million', '1 billion', '10 billion'],
          correctAnswer: 2,
          explanation: 'Consider buildings, floors, and windows per floor.',
          difficulty: 'medium'
        }
      ],
      technical: [
        {
          id: 'a3',
          question: 'Design a system to handle millions of requests per second.',
          category: 'technical',
          expectedPoints: ['Load balancing', 'Caching', 'Database sharding', 'CDN usage']
        },
        {
          id: 'a4',
          question: 'Explain eventual consistency in distributed systems.',
          category: 'technical',
          expectedPoints: ['CAP theorem', 'Trade-offs', 'Use cases', 'Implementation strategies']
        }
      ],
      behavioral: [
        {
          id: 'a5',
          question: 'Tell me about a time you had to make a decision with incomplete information.',
          category: 'behavioral',
          expectedPoints: ['Decision framework', 'Risk assessment', 'Information gathering', 'Outcome']
        },
        {
          id: 'a6',
          question: 'Describe a time when you went above and beyond for a customer.',
          category: 'behavioral',
          expectedPoints: ['Customer focus', 'Extra effort', 'Impact', 'Learning']
        }
      ]
    }
  },
  {
    companyName: 'Apple',
    logo: 'apple',
    questions: {
      aptitude: [
        {
          id: 'ap1',
          question: 'How would you test a toaster?',
          options: ['Only functional testing', 'Only safety testing', 'Comprehensive testing approach', 'User testing only'],
          correctAnswer: 2,
          explanation: 'Consider functionality, safety, usability, and edge cases.',
          difficulty: 'medium'
        },
        {
          id: 'ap2',
          question: 'Why are manhole covers round?',
          options: ['Easier to manufacture', 'Cannot fall through', 'Aesthetic reasons', 'Historical reasons'],
          correctAnswer: 1,
          explanation: 'Round covers cannot fall through the opening regardless of orientation.',
          difficulty: 'easy'
        }
      ],
      technical: [
        {
          id: 'ap3',
          question: 'How would you optimize battery life in a mobile app?',
          category: 'technical',
          expectedPoints: ['Background processing', 'Network optimization', 'Display management', 'CPU usage']
        },
        {
          id: 'ap4',
          question: 'Explain the iOS app lifecycle.',
          category: 'technical',
          expectedPoints: ['App states', 'Delegate methods', 'Memory management', 'Background modes']
        }
      ],
      behavioral: [
        {
          id: 'ap5',
          question: 'Tell me about a time you had to convince someone to change their mind.',
          category: 'behavioral',
          expectedPoints: ['Persuasion strategy', 'Evidence presented', 'Empathy shown', 'Result achieved']
        },
        {
          id: 'ap6',
          question: 'How do you approach innovation in your work?',
          category: 'behavioral',
          expectedPoints: ['Creative process', 'Risk taking', 'Experimentation', 'Implementation']
        }
      ]
    }
  },
  {
    companyName: 'Meta (Facebook)',
    logo: 'infinity',
    questions: {
      aptitude: [
        {
          id: 'f1',
          question: 'How many people are using Facebook right now?',
          options: ['100 million', '500 million', '1 billion', '2 billion'],
          correctAnswer: 2,
          explanation: 'Consider global users, time zones, and usage patterns.',
          difficulty: 'medium'
        },
        {
          id: 'f2',
          question: 'Design a parking lot system.',
          options: ['Single level only', 'Multi-level with basic features', 'Smart parking system', 'Valet parking only'],
          correctAnswer: 2,
          explanation: 'Consider scalability, efficiency, and modern features.',
          difficulty: 'medium'
        }
      ],
      technical: [
        {
          id: 'f3',
          question: 'How would you design Facebook\'s news feed?',
          category: 'technical',
          expectedPoints: ['Ranking algorithm', 'Real-time updates', 'Scalability', 'Personalization']
        },
        {
          id: 'f4',
          question: 'Explain how you would handle data consistency in a social network.',
          category: 'technical',
          expectedPoints: ['Eventual consistency', 'Conflict resolution', 'Replication', 'Performance trade-offs']
        }
      ],
      behavioral: [
        {
          id: 'f5',
          question: 'Tell me about a time you had to make a trade-off between speed and quality.',
          category: 'behavioral',
          expectedPoints: ['Decision criteria', 'Stakeholder communication', 'Risk mitigation', 'Outcome']
        },
        {
          id: 'f6',
          question: 'How do you stay updated with technology trends?',
          category: 'behavioral',
          expectedPoints: ['Learning sources', 'Practical application', 'Knowledge sharing', 'Continuous improvement']
        }
      ]
    }
  },
  {
    companyName: 'Netflix',
    logo: 'netflix',
    questions: {
      aptitude: [
        {
          id: 'n1',
          question: 'How would you improve Netflix\'s recommendation system?',
          options: ['More user data', 'Better algorithms', 'Hybrid approach', 'Social features'],
          correctAnswer: 2,
          explanation: 'Combine multiple approaches for better recommendations.',
          difficulty: 'medium'
        },
        {
          id: 'n2',
          question: 'Estimate Netflix\'s bandwidth usage during peak hours.',
          options: ['1 TB/s', '10 TB/s', '100 TB/s', '1 PB/s'],
          correctAnswer: 2,
          explanation: 'Consider concurrent users, video quality, and compression.',
          difficulty: 'hard'
        }
      ],
      technical: [
        {
          id: 'n3',
          question: 'How would you handle video streaming at scale?',
          category: 'technical',
          expectedPoints: ['CDN strategy', 'Adaptive bitrate', 'Caching', 'Load balancing']
        },
        {
          id: 'n4',
          question: 'Design a system for A/B testing at Netflix scale.',
          category: 'technical',
          expectedPoints: ['Experiment design', 'Statistical significance', 'User segmentation', 'Results analysis']
        }
      ],
      behavioral: [
        {
          id: 'n5',
          question: 'Tell me about a time you had to work with ambiguous requirements.',
          category: 'behavioral',
          expectedPoints: ['Clarification process', 'Assumption management', 'Iterative approach', 'Communication']
        },
        {
          id: 'n6',
          question: 'How do you approach data-driven decision making?',
          category: 'behavioral',
          expectedPoints: ['Data collection', 'Analysis methods', 'Interpretation', 'Action planning']
        }
      ]
    }
  },
  {
    companyName: 'Tesla',
    logo: 'tesla',
    questions: {
      aptitude: [
        {
          id: 't1',
          question: 'How would you increase the efficiency of an electric motor?',
          options: ['Better materials', 'Improved design', 'Advanced control systems', 'All of the above'],
          correctAnswer: 3,
          explanation: 'Multiple approaches can improve motor efficiency.',
          difficulty: 'medium'
        },
        {
          id: 't2',
          question: 'Estimate the number of charging stations needed for a city.',
          options: ['100-500', '500-1000', '1000-5000', '5000+'],
          correctAnswer: 2,
          explanation: 'Consider population, EV adoption rate, and charging patterns.',
          difficulty: 'medium'
        }
      ],
      technical: [
        {
          id: 't3',
          question: 'How would you optimize battery management in an electric vehicle?',
          category: 'technical',
          expectedPoints: ['Thermal management', 'Charge balancing', 'State estimation', 'Safety systems']
        },
        {
          id: 't4',
          question: 'Explain the challenges in autonomous vehicle perception.',
          category: 'technical',
          expectedPoints: ['Sensor fusion', 'Real-time processing', 'Edge cases', 'Safety validation']
        }
      ],
      behavioral: [
        {
          id: 't5',
          question: 'Tell me about a time you had to solve a complex technical problem.',
          category: 'behavioral',
          expectedPoints: ['Problem analysis', 'Solution approach', 'Implementation', 'Results']
        },
        {
          id: 't6',
          question: 'How do you handle working in a fast-paced, high-pressure environment?',
          category: 'behavioral',
          expectedPoints: ['Stress management', 'Prioritization', 'Team collaboration', 'Quality maintenance']
        }
      ]
    }
  }
];

interface CompanyQuestionsProps {
  onComplete: () => void;
}

export const CompanyQuestions: React.FC<CompanyQuestionsProps> = ({ onComplete }) => {
  const categorySequence: Array<'aptitude' | 'technical' | 'behavioral'> = ['aptitude', 'technical', 'behavioral'];
  const [selectedCompany, setSelectedCompany] = useState<CompanyQuestionsType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'aptitude' | 'technical' | 'behavioral'>('aptitude');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [completedCategories, setCompletedCategories] = useState<Array<'aptitude' | 'technical' | 'behavioral'>>([]);

  const getCompanyIcon = (logo: string) => {
    const iconProps = { className: "w-16 h-16", size: 64 };
    switch (logo) {
      case 'search': return (
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="relative">
            <Search className="w-12 h-12 text-blue-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="absolute top-1 -left-1 w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      );
      case 'squares': return (
        <div className="w-16 h-16 grid grid-cols-2 gap-1">
          <Square className="w-6 h-6 text-red-500" />
          <Square className="w-6 h-6 text-green-500" />
          <Square className="w-6 h-6 text-blue-500" />
          <Square className="w-6 h-6 text-yellow-500" />
        </div>
      );
      case 'arrow': return (
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-8 bg-orange-500 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">a</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 transform rotate-45"></div>
          </div>
        </div>
      );
      case 'apple': return <Apple {...iconProps} className="w-16 h-16 text-gray-800" />;
      case 'infinity': return (
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-6 border-4 border-blue-600 rounded-full"></div>
            <div className="absolute top-0 left-0 w-6 h-6 border-4 border-blue-600 rounded-full"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-4 border-blue-600 rounded-full"></div>
          </div>
        </div>
      );
      case 'netflix': return (
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600 rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
        </div>
      );
      case 'tesla': return (
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-red-600 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-lg">T</span>
            </div>
          </div>
        </div>
      );
      default: return <Building2 {...iconProps} className="w-16 h-16 text-gray-500" />;
    }
  };

  const handleCompanySelect = (company: CompanyQuestionsType) => {
    setSelectedCompany(company);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setSelectedCategory('aptitude');
    setCompletedCategories([]);
  };

  // Remove handleCategoryChange from UI flow

  const handleAnswer = (questionId: string, answer: any) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (!selectedCompany) return;
    const questions = selectedCompany.questions[selectedCategory];
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finished current category, move to next or show results
      const nextCategoryIndex = categorySequence.indexOf(selectedCategory) + 1;
      setCompletedCategories(prev => [...prev, selectedCategory]);
      if (nextCategoryIndex < categorySequence.length) {
        setSelectedCategory(categorySequence[nextCategoryIndex]);
        setCurrentQuestionIndex(0);
      } else {
        setShowResults(true);
      }
    }
  };

  const resetPractice = () => {
    setSelectedCompany(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setSelectedCategory('aptitude');
    setCompletedCategories([]);
  };

  if (!selectedCompany) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Company Interview Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Practice with real interview questions from top tech companies. 
              Each company has aptitude, technical, and behavioral questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companyData.map((company) => (
              <div
                key={company.companyName}
                onClick={() => handleCompanySelect(company)}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    {getCompanyIcon(company.logo)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{company.companyName}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Aptitude Questions:</span>
                      <span className="font-medium">{company.questions.aptitude.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Technical Questions:</span>
                      <span className="font-medium">{company.questions.technical.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Behavioral Questions:</span>
                      <span className="font-medium">{company.questions.behavioral.length}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">Start Practice</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Why Practice Company-Specific Questions?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Targeted Preparation</h4>
                <p className="text-gray-600">Focus on questions specific to your target company's interview style and culture.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Higher Success Rate</h4>
                <p className="text-gray-600">Increase your chances by practicing with questions similar to actual interviews.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Build Confidence</h4>
                <p className="text-gray-600">Gain confidence by familiarizing yourself with company-specific question patterns.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestions = selectedCompany.questions[selectedCategory];
  const currentQuestion = currentQuestions[currentQuestionIndex];

  if (showResults) {
    // Show summary for all categories
    const totalQuestions = categorySequence.reduce((sum, cat) => sum + selectedCompany.questions[cat].length, 0);
    const answeredQuestions = Object.keys(userAnswers).length;
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-green-50 to-blue-100 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">{getCompanyIcon(selectedCompany.logo)}</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedCompany.companyName} - Results</h2>
            <p className="text-lg text-gray-600">All Categories</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Practice Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{answeredQuestions}</div>
                <div className="text-sm text-blue-800">Questions Attempted</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{totalQuestions}</div>
                <div className="text-sm text-green-800">Total Questions</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={resetPractice}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Choose Another Company
            </button>
            <button
              onClick={onComplete}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center">
              {getCompanyIcon(selectedCompany.logo)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedCompany.companyName}</h2>
              <p className="text-gray-600 capitalize">{selectedCategory} Questions</p>
            </div>
          </div>
          <button
            onClick={resetPractice}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Companies
          </button>
        </div>

        {/* Category Selector removed for sequential flow */}

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {currentQuestions.length}
            </h3>
            <div className="text-sm text-gray-600">
              {selectedCategory === 'aptitude' && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  (currentQuestion as any).difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  (currentQuestion as any).difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {(currentQuestion as any).difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-800 text-lg mb-4">{currentQuestion.question}</p>
            
            {selectedCategory === 'aptitude' && (currentQuestion as any).options && (
              <div className="space-y-3">
                {(currentQuestion as any).options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      userAnswers[currentQuestion.id] === index
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}. </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {(selectedCategory === 'technical' || selectedCategory === 'behavioral') && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Key Points to Cover:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {(currentQuestion as any).expectedPoints.map((point: string, index: number) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
                <textarea
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Progress: {currentQuestionIndex + 1} / {currentQuestions.length}
            </div>
            <button
              onClick={nextQuestion}
              disabled={userAnswers[currentQuestion.id] === undefined}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {currentQuestionIndex === currentQuestions.length - 1 ? 'Finish' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

