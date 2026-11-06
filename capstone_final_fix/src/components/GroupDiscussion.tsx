import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Users, MessageCircle, Volume2, AlertCircle, X, LogOut } from 'lucide-react';
import { AIParticipant, GroupDiscussionTopic } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const discussionTopics: GroupDiscussionTopic[] = [
  {
    id: '1',
    topic: 'The Impact of AI on Future Employment',
    description: 'Discuss how artificial intelligence will affect job markets and employment in the next decade.',
    duration: 15
  },
  {
    id: '2',
    topic: 'Remote Work: The Future of Professional Life',
    description: 'Analyze the long-term implications of remote work on productivity, company culture, and work-life balance.',
    duration: 15
  },
  {
    id: '3',
    topic: 'Climate Change and Corporate Responsibility',
    description: 'Debate the role of corporations in combating climate change and promoting sustainability.',
    duration: 15
  },
  {
    id: '4',
    topic: 'The Rise of Electric Vehicles',
    description: 'Discuss the challenges and opportunities presented by the increasing adoption of electric vehicles.',
    duration: 15
  },
  {
    id: '5',
    topic: 'Social Media: Boon or Bane?',
    description: 'Examine the positive and negative effects of social media on society and individual well-being.',
    duration: 15
  },
  {
    id: '6',
    topic: 'Universal Basic Income: Solution or Problem?',
    description: 'Debate whether universal basic income is a viable solution to economic inequality.',
    duration: 15
  }
];

const aiParticipants: AIParticipant[] = [
  {
    id: 'alex',
    name: 'Alex Chen',
    avatar: '👨‍💼',
    personality: 'analytical',
    speaking: false
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    avatar: '👩‍💼',
    personality: 'supportive',
    speaking: false
  },
  {
    id: 'jordan',
    name: 'Jordan Davis',
    avatar: '👨‍💻',
    personality: 'creative',
    speaking: false
  }
];

interface GroupDiscussionProps {
  onComplete: (score: number) => void;
}

export const GroupDiscussion: React.FC<GroupDiscussionProps> = ({ onComplete }) => {
  // Pick a random topic on mount
  const [currentTopic] = useState(() => {
    const idx = Math.floor(Math.random() * discussionTopics.length);
    return discussionTopics[idx];
  });
  const [timeLeft, setTimeLeft] = useState(currentTopic.duration * 60);
  const [participants, setParticipants] = useState(aiParticipants);
  const participantsRef = useRef(participants);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const [messages, setMessages] = useState<Array<{
    speaker: string;
    content: string;
    timestamp: Date;
    isUser: boolean;
  }>>([]);
  const [userSpeakingTime, setUserSpeakingTime] = useState(0);
  const [evaluationCriteria, setEvaluationCriteria] = useState({
    participation: 0,
    relevance: 0,
    communication: 0,
    leadership: 0
  });
  const [aiActive, setAiActive] = useState(false);

  const aiResponseTimeoutRef = useRef<any>(null);
  const aiSpeakingTimeoutRef = useRef<any>(null);
  const isActiveRef = useRef(true);
  const currentSpeakerIndexRef = useRef(-1); // To keep track of who spoke last

  const { transcript, isListening, isSupported, error, startListening, stopListening, resetTranscript, clearError } = useSpeechRecognition();
  const { speak, speaking, cancel, supported: speechSupported, voices } = useSpeechSynthesis();

  // Timer for discussion duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (discussionStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      finishDiscussion();
    }
    return () => clearInterval(interval);
  }, [discussionStarted, timeLeft]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (aiResponseTimeoutRef.current) clearTimeout(aiResponseTimeoutRef.current);
      if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current);
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    if (transcript) {
      const newMessage = {
        speaker: 'You',
        content: transcript,
        timestamp: new Date(),
        isUser: true
      };
      setMessages(prev => [...prev, newMessage]);
      evaluateUserInput(transcript);
      resetTranscript();
    }
  }, [transcript]);

  const simulateAIParticipation = useCallback(() => {
    if (!isActiveRef.current || !aiActive) return;
    if (!voices || voices.length === 0) {
      console.warn('No speech synthesis voices available. Bots will not speak.');
      return;
    }
    console.log('Setting up AI participation...');
    
    const responses = {
      analytical: [
        "Looking at the data and current trends, I believe we need to consider the statistical implications of artificial intelligence on employment rates.",
        "From a research perspective, studies show that automation typically creates new job categories while eliminating others.",
        "Let me present a counterargument based on factual evidence from previous technological revolutions.",
        "Analyzing the numbers, it's clear that technology adoption often leads to a shift in required skills rather than outright job loss.",
        "If we examine the economic data, we can see both risks and opportunities for the workforce.",
        "Statistical models suggest that while some jobs will be automated, new roles will emerge that we can't yet predict."
      ],
      supportive: [
        "I really appreciate that point! Building on what was just said, I think we should also consider the human element in this discussion.",
        "That's an excellent perspective. I'd like to add that we need to focus on retraining and upskilling programs for affected workers.",
        "I completely agree with the previous speaker, and here's why this approach could benefit everyone involved.",
        "Supporting each other through these changes is crucial for a positive outcome.",
        "I think empathy and collaboration will help us navigate these challenges.",
        "It's important to remember the social impact and ensure no one is left behind."
      ],
      creative: [
        "What if we approached this from a completely different angle? Instead of fearing AI, we could embrace it as a collaborative tool.",
        "Here's an innovative solution we haven't considered: creating hybrid roles where humans and AI work together.",
        "Let me share a creative example that illustrates this point - imagine AI as a creative partner rather than a replacement.",
        "We could design new industries around emerging technologies, fostering creativity and growth.",
        "Imagine a future where technology enhances our abilities rather than replaces them.",
        "Let's brainstorm ways to turn these challenges into opportunities for innovation."
      ]
    };

    const scheduleAIResponse = () => {
      if (!isActiveRef.current || !discussionStarted || timeLeft <= 0 || !aiActive) {
        console.log('Stopping AI responses - discussion ended, user speaking, or component unmounted');
        return;
      }
      // Consistent time gap between bots
      const delay = 4000 + Math.random() * 2000; // 4-6 seconds
      console.log(`Scheduling next AI response in ${Math.round(delay/1000)} seconds`);
      
      aiResponseTimeoutRef.current = setTimeout(() => {
        if (!isActiveRef.current || !discussionStarted || !aiActive) return;
        
        // Determine next participant to speak
        let nextSpeakerIndex = (currentSpeakerIndexRef.current + 1) % participantsRef.current.length;
        let nextParticipant = participantsRef.current[nextSpeakerIndex];

        // Ensure the next participant is not currently speaking (shouldn't happen with proper state management)
        // and cycle through if needed to find an available one (though ideally all should be available)
        let attempts = 0;
        while (nextParticipant.speaking && attempts < participantsRef.current.length) {
          nextSpeakerIndex = (nextSpeakerIndex + 1) % participantsRef.current.length;
          nextParticipant = participantsRef.current[nextSpeakerIndex];
          attempts++;
        }

        if (nextParticipant.speaking) { // If after all attempts, still no available participant
          scheduleAIResponse(); // Try again later
          return;
        }

        currentSpeakerIndexRef.current = nextSpeakerIndex; // Update the last speaker index

        // Pick topic-specific responses if desired (future enhancement)
        const possibleResponses = responses[nextParticipant.personality as keyof typeof responses];
        const response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];

        console.log(`${nextParticipant.name} is speaking:`, response.substring(0, 50) + '...');

        // Mark participant as speaking
        setParticipants(prev => prev.map(p => 
          p.id === nextParticipant.id ? { ...p, speaking: true } : { ...p, speaking: false }
        ));
        const aiMessage = {
          speaker: nextParticipant.name,
          content: response,
          timestamp: new Date(),
          isUser: false
        };
        const voiceIndex = Math.floor(Math.random() * voices.length);
        const rate = 0.9 + Math.random() * 0.3;
        speak(response, voiceIndex, rate);
        const speakingDuration = response.length * 50 + 2000;
        aiSpeakingTimeoutRef.current = setTimeout(() => {
          if (isActiveRef.current && aiActive) {
            setParticipants(prev => prev.map(p => ({ ...p, speaking: false })));
            setMessages(prev => [...prev, aiMessage]); // Show message after speaking
            if (discussionStarted && timeLeft > 0 && aiActive) {
              scheduleAIResponse();
            }
          }
        }, speakingDuration);
      }, delay);
    };

    // Start the first AI response only if discussion is active
    if (discussionStarted && timeLeft > 0 && aiActive) {
      scheduleAIResponse();
    }
  }, [discussionStarted, timeLeft, speak, isActiveRef, voices, aiActive]);

  const startDiscussion = useCallback(() => {
    console.log('Starting discussion...');
    setDiscussionStarted(true);
    isActiveRef.current = true;
    const welcomeMessage = {
      speaker: 'Moderator',
      content: `Welcome everyone! Today we'll be discussing "${currentTopic.topic}". ${currentTopic.description} You have ${currentTopic.duration} minutes. Let's begin!`,
      timestamp: new Date(),
      isUser: false
    };
    setMessages([welcomeMessage]);
    speak(welcomeMessage.content, 0, 1, 1);
    // Remove AI start logic from here
  }, [currentTopic, speak]);

  // Start AI participation after moderator's message is in messages and discussionStarted is true
  useEffect(() => {
    if (
      discussionStarted &&
      messages.length > 0 &&
      messages[0].speaker === 'Moderator'
    ) {
      // Wait for the moderator's message to be spoken, then start AI
      aiSpeakingTimeoutRef.current = setTimeout(() => {
        if (isActiveRef.current) {
          setAiActive(true); // Start AI cycle
        }
      }, messages[0].content.length * 50 + 200); // Short delay after moderator
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussionStarted, messages]);

  // Start/stop AI cycle when aiActive changes
  useEffect(() => {
    if (aiActive) {
      simulateAIParticipation();
    } else {
      if (aiResponseTimeoutRef.current) clearTimeout(aiResponseTimeoutRef.current);
      if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current);
      setParticipants(prev => prev.map(p => ({ ...p, speaking: false })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiActive]);

  // Silence bots when user is speaking, resume when user stops
  useEffect(() => {
    if (isListening) {
      // User started speaking: stop all AI bot timeouts and silence bots
      setAiActive(false);
    } else {
      // User stopped speaking: resume AI participation if discussion is active
      if (discussionStarted && timeLeft > 0) {
        setAiActive(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const evaluateUserInput = (input: string) => {
    const words = input.toLowerCase().split(' ');
    const relevantKeywords = ['believe', 'think', 'analyze', 'consider', 'perspective', 'solution', 'important'];
    const relevanceScore = words.filter(word => relevantKeywords.includes(word)).length;

    setEvaluationCriteria(prev => ({
      participation: Math.min(prev.participation + 10, 100),
      relevance: Math.min(prev.relevance + relevanceScore * 5, 100),
      communication: Math.min(prev.communication + (input.length > 50 ? 15 : 5), 100),
      leadership: prev.leadership + (input.includes('suggest') || input.includes('propose') ? 10 : 0)
    }));

    setUserSpeakingTime(prev => prev + Math.floor(input.length / 10));
  };

  const finishDiscussion = () => {
    console.log('Finishing discussion...');
    isActiveRef.current = false;
    
    if (aiResponseTimeoutRef.current) clearTimeout(aiResponseTimeoutRef.current);
    if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current);
    cancel();
    
    const avgScore = Object.values(evaluationCriteria).reduce((a, b) => a + b, 0) / 4;
    const timeScore = (userSpeakingTime / (currentTopic.duration * 60)) * 100;
    const finalScore = Math.min(Math.round((avgScore + timeScore) / 2), 100);
    
    onComplete(finalScore);
  };

  const handleExit = () => {
    console.log('Exiting discussion...');
    isActiveRef.current = false;
    setAiActive(false);
    
    stopListening();
    cancel();
    if (aiResponseTimeoutRef.current) clearTimeout(aiResponseTimeoutRef.current);
    if (aiSpeakingTimeoutRef.current) clearTimeout(aiSpeakingTimeoutRef.current);
    onComplete(0); // Indicate early exit with a score of 0
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Group Discussion</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-lg font-mono font-bold text-gray-700">
                {formatTime(timeLeft)}
              </span>
            </div>
            {!speechSupported && (
              <div className="bg-yellow-100 px-3 py-1 rounded-lg">
                <span className="text-xs text-yellow-800">Speech not supported</span>
              </div>
            )}
            {voices && voices.length === 0 && (
              <div className="bg-yellow-100 px-3 py-1 rounded-lg mt-2">
                <span className="text-xs text-yellow-800">No speech synthesis voices available. Bots will not speak.</span>
              </div>
            )}
            {!discussionStarted ? (
              <button
                onClick={startDiscussion}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Start Discussion
              </button>
            ) : (
              <>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!isSupported}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !isSupported 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isListening 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>
                    {!isSupported ? 'Voice Not Supported' : isListening ? 'Stop Speaking' : 'Start Speaking'}
                  </span>
                </button>
                <button
                  onClick={handleExit}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Exit</span>
                </button>
              </>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Topic and Participants */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Discussion Topic</h3>
            <div className="mb-6">
              <h4 className="font-medium text-purple-700 mb-2">{currentTopic.topic}</h4>
              <p className="text-sm text-gray-600">{currentTopic.description}</p>
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Participants
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl">👤</div>
                <div>
                  <p className="font-medium text-blue-700">You</p>
                  <p className="text-xs text-blue-600">
                    {isListening ? 'Speaking...' : 'Listening'}
                  </p>
                </div>
              </div>
              {participants.map((participant) => (
                <div key={participant.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                  participant.speaking ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl">{participant.avatar}</div>
                  <div>
                    <p className={`font-medium ${participant.speaking ? 'text-green-700' : 'text-gray-700'}`}>
                      {participant.name}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {participant.personality}
                      {participant.speaking && ' • 🔊'}
                      {speaking && participant.speaking && ' (Speaking)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discussion Messages */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Discussion
            </h3>
            <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`${message.isUser ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-xs lg:max-w-md p-3 rounded-lg ${
                    message.isUser 
                      ? 'bg-blue-500 text-white' 
                      : message.speaker === 'Moderator'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-200 text-gray-800'
                  }`}>
                    <p className="font-medium text-sm mb-1">{message.speaker}</p>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {isListening && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Listening... {transcript && `"${transcript}"`}
                </p>
                <div className="flex space-x-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-8 bg-blue-400 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real-time Evaluation */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">AI Evaluation</h3>
            <div className="space-y-4">
              {Object.entries(evaluationCriteria).map(([criteria, score]) => (
                <div key={criteria}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium capitalize">{criteria}</span>
                    <span className="text-sm text-gray-600">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-700 mb-2">Speaking Time</h4>
                <p className="text-sm text-purple-600">
                  {userSpeakingTime}s / {currentTopic.duration * 60}s
                </p>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((userSpeakingTime / (currentTopic.duration * 60)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



