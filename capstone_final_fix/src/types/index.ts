export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface InterviewStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  score?: number;
  feedback?: string;
}

export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GroupDiscussionTopic {
  id: string;
  topic: string;
  description: string;
  duration: number; // in minutes
}

export interface AIParticipant {
  id: string;
  name: string;
  avatar: string;
  personality: 'aggressive' | 'supportive' | 'analytical' | 'creative';
  speaking: boolean;
}

export interface HRQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'situational' | 'general';
  expectedPoints: string[];
}

export interface CompanyQuestions {
  companyName: string;
  logo: string;
  questions: {
    aptitude: AptitudeQuestion[];
    technical: HRQuestion[];
    behavioral: HRQuestion[];
  };
}

export interface InterviewResult {
  stepId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  completedAt: Date;
}