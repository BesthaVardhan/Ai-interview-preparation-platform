import React, { useState, useEffect } from 'react';
import { Mic, MicOff, User, Clock, Star, AlertCircle, X } from 'lucide-react';
import { HRQuestion } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const hrQuestions: HRQuestion[] = [
  {
    id: '1',
    question: "Tell me about yourself and why you're interested in this position.",
    category: 'general',
    expectedPoints: ['Background', 'Experience', 'Interest in role', 'Career goals']
  },
  {
    id: '2',
    question: "Describe a challenging situation you faced at work and how you handled it.",
    category: 'behavioral',
    expectedPoints: ['Situation description', 'Actions taken', 'Results achieved', 'Lessons learned']
  },
  {
    id: '3',
    question: "Where do you see yourself in 5 years?",
    category: 'general',
    expectedPoints: ['Career progression', 'Skills development', 'Leadership goals', 'Industry knowledge']
  },
  {
    id: '4',
    question: "What are your greatest strengths and how do they apply to this role?",
    category: 'behavioral',
    expectedPoints: ['Specific strengths', 'Examples', 'Relevance to role', 'Self-awareness']
  }
];

interface HRInterviewProps {
  onComplete: (score: number) => void;
}

export const HRInterview: React.FC<HRInterviewProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(120); // 2 minutes per question
  const [evaluation, setEvaluation] = useState({
    communication: 0,
    confidence: 0,
    relevance: 0,
    completeness: 0
  });

  const { transcript, isListening, isSupported, error, startListening, stopListening, resetTranscript, clearError } = useSpeechRecognition();
  const { speak, speaking } = useSpeechSynthesis();

  useEffect(() => {
    if (transcript) {
      setCurrentAnswer(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewStarted && timePerQuestion > 0) {
      interval = setInterval(() => {
        setTimePerQuestion(prev => prev - 1);
      }, 1000);
    } else if (timePerQuestion === 0) {
      handleNextQuestion();
    }
    return () => clearInterval(interval);
  }, [interviewStarted, timePerQuestion]);

  const startInterview = () => {
    setInterviewStarted(true);
    const welcomeMessage = "Hello! Welcome to your HR interview. I'm excited to learn more about you. Let's begin with our first question.";
    speak(welcomeMessage);
    
    setTimeout(() => {
      speak(hrQuestions[0].question);
    }, 3000);
  };

  const evaluateAnswer = (answer: string, question: HRQuestion) => {
    const words = answer.toLowerCase().split(/\s+/).filter(Boolean);
    const expectedKeywords = question.expectedPoints.join(' ').toLowerCase().split(' ');
    
    // Calculate scores based on various criteria
    const relevanceScore = expectedKeywords.filter(keyword => 
      words.some(word => word.includes(keyword) || keyword.includes(word))
    ).length;
    
    const lengthScore = Math.min(answer.length / 200, 1) * 100; // Optimal answer length
    // Base confidence for speaking/participating: 40–65 just for giving an answer (increases with length)
    const wordCount = words.length;
    const baseConfidence = wordCount < 5 ? 25 : 40 + Math.min(Math.floor(wordCount / 4), 25);
    // Bonus for action/positive language (expanded list)
    const confidenceKeywords = [
      'achieved', 'successful', 'led', 'managed', 'improved', 'delivered',
      'responsible', 'experience', 'worked', 'developed', 'handled', 'completed',
      'strong', 'positive', 'team', 'result', 'goal', 'project'
    ];
    const keywordBonus = words.filter((word: string) => 
      confidenceKeywords.some(kw => word.includes(kw) || kw.includes(word))
    ).length * 6;
    const confidenceScore = Math.min(baseConfidence + keywordBonus, 100);
    
    const communicationScore = answer.length > 50 ? 
      Math.min(100, (answer.split('.').length - 1) * 25) : 25; // Sentence structure

    return {
      communication: Math.min(communicationScore, 100),
      confidence: Math.round(confidenceScore),
      relevance: Math.min(relevanceScore * 20, 100),
      completeness: Math.min(lengthScore, 100)
    };
  };

  const handleNextQuestion = () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...answers, currentAnswer];
      setAnswers(newAnswers);
      
      const questionEval = evaluateAnswer(currentAnswer, hrQuestions[currentQuestion]);
      const answerCount = answers.length + 1; // number of answers after this one
      setEvaluation(prev => ({
        communication: Math.round((prev.communication * answers.length + questionEval.communication) / answerCount),
        confidence: Math.round((prev.confidence * answers.length + questionEval.confidence) / answerCount),
        relevance: Math.round((prev.relevance * answers.length + questionEval.relevance) / answerCount),
        completeness: Math.round((prev.completeness * answers.length + questionEval.completeness) / answerCount)
      }));
    }

    if (currentQuestion < hrQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setCurrentAnswer('');
      setTimePerQuestion(120);
      resetTranscript();
      
      setTimeout(() => {
        speak(hrQuestions[currentQuestion + 1].question);
      }, 1500);
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    const avgScore = Object.values(evaluation).reduce((a, b) => a + b, 0) / 4;
    const completionBonus = (answers.length / hrQuestions.length) * 10;
    const finalScore = Math.min(Math.round(avgScore + completionBonus), 100);
    
    const closingMessage = "Thank you for your time today. The interview has been completed and you'll receive your feedback shortly.";
    speak(closingMessage);
    
    setTimeout(() => {
      onComplete(finalScore);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">HR Interview</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-mono font-bold text-gray-700">
                {formatTime(timePerQuestion)}
              </span>
            </div>
            {!interviewStarted ? (
              <button
                onClick={startInterview}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Start Interview
              </button>
            ) : (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !isSupported 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isListening 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>
                  {!isSupported ? 'Voice Not Supported' : isListening ? 'Stop Answer' : 'Start Answer'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Speech Recognition Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Browser Support Warning */}
        {!isSupported && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-yellow-800 text-sm">
                Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for voice input features.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* HR Interviewer */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Sarah Johnson</h3>
                <p className="text-gray-600">Senior HR Manager</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Interview Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Question {currentQuestion + 1} of {hrQuestions.length}</span>
                  <span>{Math.round(((currentQuestion + 1) / hrQuestions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / hrQuestions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {speaking && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm text-blue-700">HR is speaking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Current Question */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Current Question</h3>
            
            {interviewStarted && (
              <>
                <div className="mb-4">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    hrQuestions[currentQuestion].category === 'technical' ? 'bg-blue-100 text-blue-800' :
                    hrQuestions[currentQuestion].category === 'behavioral' ? 'bg-purple-100 text-purple-800' :
                    hrQuestions[currentQuestion].category === 'situational' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {hrQuestions[currentQuestion].category}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-800 text-lg">
                    {hrQuestions[currentQuestion].question}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Key Points to Cover:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {hrQuestions[currentQuestion].expectedPoints.map((point, index) => (
                      <li key={index} className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-2" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {isListening && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-2">Your Answer:</p>
                    <p className="text-blue-800">{currentAnswer || "Start speaking..."}</p>
                    <div className="flex space-x-1 mt-3">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-6 bg-blue-400 rounded animate-pulse"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer.trim()}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {currentQuestion === hrQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
                </button>
              </>
            )}

            {!interviewStarted && (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Click "Start Interview" to begin</p>
              </div>
            )}
          </div>

          {/* Real-time Evaluation */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {Object.entries(evaluation).map(([metric, score]) => (
                <div key={metric}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium capitalize">{metric}</span>
                    <span className="text-sm text-gray-600">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Interview Tips</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Be specific with examples</li>
                <li>• Use the STAR method</li>
                <li>• Show enthusiasm</li>
                <li>• Ask thoughtful questions</li>
              </ul>
            </div>

            {answers.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Answers Given</h4>
                <p className="text-sm text-blue-700">
                  {answers.length} of {hrQuestions.length} questions answered
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};