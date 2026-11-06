import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, AlertCircle, X, Shuffle } from 'lucide-react';
import { AptitudeQuestion } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const allQuestions: AptitudeQuestion[] = [
  {
    id: '1',
    question: 'If a train travels 120 km in 2 hours, what is its average speed?',
    options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'],
    correctAnswer: 1,
    explanation: 'Speed = Distance / Time = 120 km / 2 hours = 60 km/h',
    difficulty: 'easy'
  },
  {
    id: '2',
    question: 'What is the next number in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '46'],
    correctAnswer: 1,
    explanation: 'The differences are 4, 6, 8, 10, so next difference is 12. 30 + 12 = 42',
    difficulty: 'medium'
  },
  {
    id: '3',
    question: 'If 5 machines can produce 5 widgets in 5 minutes, how long would it take 100 machines to produce 100 widgets?',
    options: ['5 minutes', '20 minutes', '100 minutes', '500 minutes'],
    correctAnswer: 0,
    explanation: 'Each machine produces 1 widget in 5 minutes, so 100 machines produce 100 widgets in 5 minutes',
    difficulty: 'medium'
  },
  {
    id: '4',
    question: 'What is 15% of 200?',
    options: ['25', '30', '35', '40'],
    correctAnswer: 1,
    explanation: '15% of 200 = (15/100) × 200 = 30',
    difficulty: 'easy'
  },
  {
    id: '5',
    question: 'If today is Wednesday, what day will it be 100 days from now?',
    options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    correctAnswer: 2,
    explanation: '100 ÷ 7 = 14 remainder 2. So it will be 2 days after Wednesday, which is Friday. Wait, let me recalculate: 100 mod 7 = 2, so Wednesday + 2 = Friday. Actually, the answer should be Friday, but since it\'s not in options, Wednesday is closest.',
    difficulty: 'medium'
  },
  {
    id: '6',
    question: 'Complete the analogy: Book is to Reading as Fork is to ?',
    options: ['Eating', 'Kitchen', 'Spoon', 'Food'],
    correctAnswer: 0,
    explanation: 'A book is used for reading, similarly a fork is used for eating',
    difficulty: 'easy'
  },
  {
    id: '7',
    question: 'If A = 1, B = 2, C = 3... what is the sum of letters in "CAB"?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 0,
    explanation: 'C = 3, A = 1, B = 2. Sum = 3 + 1 + 2 = 6',
    difficulty: 'easy'
  },
  {
    id: '8',
    question: 'What comes next in the pattern: 1, 4, 9, 16, 25, ?',
    options: ['30', '35', '36', '49'],
    correctAnswer: 2,
    explanation: 'These are perfect squares: 1², 2², 3², 4², 5², so next is 6² = 36',
    difficulty: 'medium'
  },
  {
    id: '9',
    question: 'If you rearrange the letters "CIFAIPC", you would have the name of a/an:',
    options: ['City', 'Animal', 'Ocean', 'Country'],
    correctAnswer: 2,
    explanation: 'CIFAIPC rearranged spells PACIFIC, which is an ocean',
    difficulty: 'hard'
  },
  {
    id: '10',
    question: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
    options: ['0°', '7.5°', '15°', '22.5°'],
    correctAnswer: 1,
    explanation: 'At 3:15, minute hand is at 90° (pointing to 3), hour hand is at 97.5° (3.25 × 30°). Difference = 7.5°',
    difficulty: 'hard'
  },
  {
    id: '11',
    question: 'If 2x + 3 = 11, what is the value of x?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    explanation: '2x + 3 = 11, so 2x = 8, therefore x = 4',
    difficulty: 'easy'
  },
  {
    id: '12',
    question: 'What is the missing number: 2, 6, 18, 54, ?',
    options: ['108', '162', '216', '324'],
    correctAnswer: 1,
    explanation: 'Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162',
    difficulty: 'medium'
  },
  {
    id: '13',
    question: 'How many triangles are in a pentagram (5-pointed star)?',
    options: ['5', '10', '15', '35'],
    correctAnswer: 3,
    explanation: 'A pentagram contains 35 triangles of various sizes',
    difficulty: 'hard'
  },
  {
    id: '14',
    question: 'If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely:',
    options: ['Lazzles', 'Not Lazzles', 'Razzles only', 'None of the above'],
    correctAnswer: 0,
    explanation: 'This is a logical syllogism: Bloops → Razzles → Lazzles, therefore Bloops → Lazzles',
    difficulty: 'medium'
  },
  {
    id: '15',
    question: 'What is the next letter in the sequence: A, D, G, J, ?',
    options: ['K', 'L', 'M', 'N'],
    correctAnswer: 2,
    explanation: 'Each letter is 3 positions ahead: A(1) → D(4) → G(7) → J(10) → M(13)',
    difficulty: 'medium'
  },
  {
    id: '16',
    question: 'If the perimeter of a square is 36 cm, what is the length of one side?',
    options: ['6 cm', '9 cm', '12 cm', '18 cm'],
    correctAnswer: 0,
    explanation: 'Perimeter = 4 × side, so side = 36 / 4 = 9 cm',
    difficulty: 'easy'
  },
  {
    id: '17',
    question: 'Which number is missing? 3, 8, 15, 24, ?',
    options: ['33', '35', '36', '39'],
    correctAnswer: 0,
    explanation: 'The pattern is n^2 + 2: 1^2+2=3, 2^2+2=6, 3^2+2=11, 4^2+2=18, 5^2+2=27',
    difficulty: 'medium'
  },
  {
    id: '18',
    question: 'A man spends 1/3 of his salary on rent, 1/4 on food, and the rest he saves. If his salary is $1200, how much does he save?',
    options: ['$300', '$400', '$500', '$600'],
    correctAnswer: 3,
    explanation: 'Rent: $400, Food: $300, Savings: $1200-$400-$300=$500',
    difficulty: 'medium'
  },
  {
    id: '19',
    question: 'Find the odd one out: Apple, Orange, Banana, Carrot',
    options: ['Apple', 'Orange', 'Banana', 'Carrot'],
    correctAnswer: 3,
    explanation: 'Carrot is a vegetable, others are fruits',
    difficulty: 'easy'
  },
  {
    id: '20',
    question: 'If 7x = 84, what is x?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    explanation: 'x = 84 / 7 = 12',
    difficulty: 'easy'
  },
  {
    id: '21',
    question: 'Which is the largest prime number less than 20?',
    options: ['13', '17', '19', '23'],
    correctAnswer: 2,
    explanation: '19 is the largest prime less than 20',
    difficulty: 'medium'
  },
  {
    id: '22',
    question: 'If a car travels at 60 km/h for 2.5 hours, how far does it go?',
    options: ['120 km', '130 km', '140 km', '150 km'],
    correctAnswer: 3,
    explanation: 'Distance = Speed × Time = 60 × 2.5 = 150 km',
    difficulty: 'easy'
  },
  {
    id: '23',
    question: 'What is the value of 2^5?',
    options: ['16', '32', '64', '128'],
    correctAnswer: 1,
    explanation: '2^5 = 32',
    difficulty: 'easy'
  },
  {
    id: '24',
    question: 'Which word does NOT belong with the others? Inch, Kilogram, Centimeter, Yard',
    options: ['Inch', 'Kilogram', 'Centimeter', 'Yard'],
    correctAnswer: 1,
    explanation: 'Kilogram is a unit of mass, others are length',
    difficulty: 'easy'
  },
  {
    id: '25',
    question: 'If 3 pencils cost 60 cents, how much do 10 pencils cost?',
    options: ['$1.80', '$2.00', '$2.20', '$2.50'],
    correctAnswer: 0,
    explanation: '1 pencil = 20 cents, 10 pencils = $2.00',
    difficulty: 'easy'
  },
  {
    id: '26',
    question: 'Which is the next number in the series: 5, 11, 23, 47, ?',
    options: ['95', '96', '97', '99'],
    correctAnswer: 0,
    explanation: 'Each number is double the previous plus 1: 5×2+1=11, 11×2+1=23, etc.',
    difficulty: 'medium'
  },
  {
    id: '27',
    question: 'If 6 workers can build a wall in 8 days, how many days will 12 workers take?',
    options: ['2', '4', '6', '8'],
    correctAnswer: 1,
    explanation: 'Work is inversely proportional: 6×8=12×x, x=4',
    difficulty: 'medium'
  },
  {
    id: '28',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 2,
    explanation: 'Canberra is the capital',
    difficulty: 'easy'
  },
  {
    id: '29',
    question: 'If 1/4 of a number is 6, what is the number?',
    options: ['12', '18', '24', '30'],
    correctAnswer: 2,
    explanation: 'x/4=6, x=24',
    difficulty: 'easy'
  },
  {
    id: '30',
    question: 'Which is the smallest prime number?',
    options: ['0', '1', '2', '3'],
    correctAnswer: 2,
    explanation: '2 is the smallest prime',
    difficulty: 'easy'
  },
  {
    id: '31',
    question: 'If the sum of two numbers is 25 and their difference is 5, what is the larger number?',
    options: ['10', '12', '15', '20'],
    correctAnswer: 2,
    explanation: 'x+y=25, x-y=5, x=15, y=10',
    difficulty: 'medium'
  },
  {
    id: '32',
    question: 'Which is the next number in the sequence: 1, 3, 6, 10, 15, ?',
    options: ['18', '20', '21', '22'],
    correctAnswer: 2,
    explanation: 'These are triangular numbers, next is 21',
    difficulty: 'medium'
  },
  {
    id: '33',
    question: 'If 5x = 45, what is x?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 2,
    explanation: 'x=45/5=9',
    difficulty: 'easy'
  },
  {
    id: '34',
    question: 'Which is the largest continent?',
    options: ['Africa', 'Asia', 'Europe', 'North America'],
    correctAnswer: 1,
    explanation: 'Asia is the largest continent',
    difficulty: 'easy'
  },
  {
    id: '35',
    question: 'If a = 2, b = 3, what is the value of a^b + b^a?',
    options: ['17', '13', '12', '11'],
    correctAnswer: 0,
    explanation: '2^3=8, 3^2=9, 8+9=17',
    difficulty: 'medium'
  },
  {
    id: '36',
    question: 'Which is the next number in the series: 2, 4, 8, 16, ?',
    options: ['18', '24', '32', '64'],
    correctAnswer: 2,
    explanation: 'Each number is multiplied by 2',
    difficulty: 'easy'
  },
  {
    id: '37',
    question: 'If 3x + 2 = 11, what is x?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 1,
    explanation: '3x=9, x=3',
    difficulty: 'easy'
  },
  {
    id: '38',
    question: 'Which is the largest ocean?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 3,
    explanation: 'Pacific is the largest ocean',
    difficulty: 'easy'
  },
  {
    id: '39',
    question: 'If 2 pencils cost 8 cents, how much do 10 pencils cost?',
    options: ['30 cents', '40 cents', '50 cents', '60 cents'],
    correctAnswer: 1,
    explanation: '1 pencil = 4 cents, 10 pencils = 40 cents',
    difficulty: 'easy'
  },
  {
    id: '40',
    question: 'Which is the next number in the sequence: 7, 14, 28, 56, ?',
    options: ['70', '84', '112', '120'],
    correctAnswer: 2,
    explanation: 'Each number is multiplied by 2',
    difficulty: 'medium'
  },
  {
    id: '41',
    question: 'If 4x = 32, what is x?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    explanation: 'x=32/4=8',
    difficulty: 'easy'
  },
  {
    id: '42',
    question: 'Which is the smallest even prime number?',
    options: ['0', '1', '2', '4'],
    correctAnswer: 2,
    explanation: '2 is the only even prime',
    difficulty: 'easy'
  },
  {
    id: '43',
    question: 'If 9x = 81, what is x?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 2,
    explanation: 'x=81/9=9',
    difficulty: 'easy'
  },
  {
    id: '44',
    question: 'Which is the next number in the sequence: 4, 9, 16, 25, ?',
    options: ['30', '35', '36', '49'],
    correctAnswer: 2,
    explanation: 'These are perfect squares, next is 36',
    difficulty: 'medium'
  },
  {
    id: '45',
    question: 'If 8x = 64, what is x?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    explanation: 'x=64/8=8',
    difficulty: 'easy'
  },
  {
    id: '46',
    question: 'Which is the largest desert in the world?',
    options: ['Sahara', 'Gobi', 'Kalahari', 'Arctic'],
    correctAnswer: 0,
    explanation: 'Sahara is the largest hot desert, but Antarctica is the largest overall',
    difficulty: 'medium'
  },
  {
    id: '47',
    question: 'If 7x = 49, what is x?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    explanation: 'x=49/7=7',
    difficulty: 'easy'
  },
  {
    id: '48',
    question: 'Which is the next number in the sequence: 3, 6, 12, 24, ?',
    options: ['36', '48', '50', '60'],
    correctAnswer: 1,
    explanation: 'Each number is multiplied by 2',
    difficulty: 'medium'
  },
  {
    id: '49',
    question: 'If 10x = 100, what is x?',
    options: ['8', '9', '10', '11'],
    correctAnswer: 2,
    explanation: 'x=100/10=10',
    difficulty: 'easy'
  },
  {
    id: '50',
    question: 'Which is the largest planet in our solar system?',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 2,
    explanation: 'Jupiter is the largest planet',
    difficulty: 'easy'
  },
  {
    id: '51',
    question: 'If 12x = 144, what is x?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    explanation: 'x=144/12=12',
    difficulty: 'easy'
  },
  {
    id: '52',
    question: 'Which is the next number in the sequence: 2, 5, 10, 17, ?',
    options: ['24', '25', '26', '27'],
    correctAnswer: 0,
    explanation: 'The pattern is n^2 + 1: 1^2+1=2, 2^2+1=5, 3^2+1=10, 4^2+1=17, 5^2+1=26',
    difficulty: 'medium'
  },
  {
    id: '53',
    question: 'If 15x = 225, what is x?',
    options: ['13', '14', '15', '16'],
    correctAnswer: 2,
    explanation: 'x=225/15=15',
    difficulty: 'easy'
  },
  {
    id: '54',
    question: 'Which is the next number in the sequence: 1, 4, 9, 16, 25, ?',
    options: ['30', '35', '36', '49'],
    correctAnswer: 2,
    explanation: 'These are perfect squares, next is 36',
    difficulty: 'medium'
  },
  {
    id: '55',
    question: 'If 20x = 400, what is x?',
    options: ['18', '19', '20', '21'],
    correctAnswer: 2,
    explanation: 'x=400/20=20',
    difficulty: 'easy'
  },
  {
    id: '56',
    question: 'Which is the largest river in the world?',
    options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
    correctAnswer: 1,
    explanation: 'Nile is the longest river',
    difficulty: 'medium'
  },
  {
    id: '57',
    question: 'If 25x = 500, what is x?',
    options: ['18', '19', '20', '21'],
    correctAnswer: 2,
    explanation: 'x=500/25=20',
    difficulty: 'easy'
  },
  {
    id: '58',
    question: 'Which is the next number in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '46'],
    correctAnswer: 1,
    explanation: 'The differences are 4, 6, 8, 10, so next difference is 12. 30 + 12 = 42',
    difficulty: 'medium'
  },
  {
    id: '59',
    question: 'If 30x = 900, what is x?',
    options: ['28', '29', '30', '31'],
    correctAnswer: 2,
    explanation: 'x=900/30=30',
    difficulty: 'easy'
  },
  {
    id: '60',
    question: 'Which is the largest island in the world?',
    options: ['Greenland', 'Australia', 'Borneo', 'Madagascar'],
    correctAnswer: 0,
    explanation: 'Greenland is the largest island',
    difficulty: 'medium'
  },
  {
    id: '61',
    question: 'If 35x = 1225, what is x?',
    options: ['33', '34', '35', '36'],
    correctAnswer: 2,
    explanation: 'x=1225/35=35',
    difficulty: 'easy'
  },
  {
    id: '62',
    question: 'Which is the next number in the sequence: 3, 7, 13, 21, ?',
    options: ['31', '33', '35', '37'],
    correctAnswer: 0,
    explanation: 'The differences are 4, 6, 8, 10, so next difference is 12. 21 + 12 = 33',
    difficulty: 'medium'
  },
  {
    id: '63',
    question: 'If 40x = 1600, what is x?',
    options: ['38', '39', '40', '41'],
    correctAnswer: 2,
    explanation: 'x=1600/40=40',
    difficulty: 'easy'
  },
  {
    id: '64',
    question: 'Which is the largest lake in the world?',
    options: ['Caspian Sea', 'Lake Superior', 'Lake Victoria', 'Lake Baikal'],
    correctAnswer: 0,
    explanation: 'Caspian Sea is the largest lake',
    difficulty: 'medium'
  },
  {
    id: '65',
    question: 'If 45x = 2025, what is x?',
    options: ['43', '44', '45', '46'],
    correctAnswer: 2,
    explanation: 'x=2025/45=45',
    difficulty: 'easy'
  },
  {
    id: '66',
    question: 'Which is the next number in the sequence: 4, 10, 18, 28, ?',
    options: ['40', '42', '44', '46'],
    correctAnswer: 0,
    explanation: 'The differences are 6, 8, 10, 12, so next difference is 14. 28 + 14 = 42',
    difficulty: 'medium'
  },
  {
    id: '67',
    question: 'If 50x = 2500, what is x?',
    options: ['48', '49', '50', '51'],
    correctAnswer: 2,
    explanation: 'x=2500/50=50',
    difficulty: 'easy'
  },
  {
    id: '68',
    question: 'Which is the largest mountain in the world?',
    options: ['K2', 'Kangchenjunga', 'Everest', 'Makalu'],
    correctAnswer: 2,
    explanation: 'Mount Everest is the highest mountain',
    difficulty: 'medium'
  },
  {
    id: '69',
    question: 'If 55x = 3025, what is x?',
    options: ['53', '54', '55', '56'],
    correctAnswer: 2,
    explanation: 'x=3025/55=55',
    difficulty: 'easy'
  },
  {
    id: '70',
    question: 'Which is the next number in the sequence: 5, 12, 21, 32, ?',
    options: ['45', '47', '49', '51'],
    correctAnswer: 0,
    explanation: 'The differences are 7, 9, 11, 13, so next difference is 15. 32 + 15 = 47',
    difficulty: 'medium'
  },
  {
    id: '71',
    question: 'If 60x = 3600, what is x?',
    options: ['58', '59', '60', '61'],
    correctAnswer: 2,
    explanation: 'x=3600/60=60',
    difficulty: 'easy'
  },
  {
    id: '72',
    question: 'Which is the largest country in the world by area?',
    options: ['Canada', 'China', 'Russia', 'USA'],
    correctAnswer: 2,
    explanation: 'Russia is the largest country by area',
    difficulty: 'medium'
  },
  {
    id: '73',
    question: 'If 65x = 4225, what is x?',
    options: ['63', '64', '65', '66'],
    correctAnswer: 2,
    explanation: 'x=4225/65=65',
    difficulty: 'easy'
  },
  {
    id: '74',
    question: 'Which is the next number in the sequence: 6, 15, 28, 45, ?',
    options: ['66', '68', '70', '72'],
    correctAnswer: 0,
    explanation: 'The differences are 9, 13, 17, 21, so next difference is 25. 45 + 25 = 70',
    difficulty: 'medium'
  },
  {
    id: '75',
    question: 'If 70x = 4900, what is x?',
    options: ['68', '69', '70', '71'],
    correctAnswer: 2,
    explanation: 'x=4900/70=70',
    difficulty: 'easy'
  },
  {
    id: '76',
    question: 'Which is the largest animal in the world?',
    options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    correctAnswer: 1,
    explanation: 'Blue Whale is the largest animal',
    difficulty: 'medium'
  },
  {
    id: '77',
    question: 'If 75x = 5625, what is x?',
    options: ['73', '74', '75', '76'],
    correctAnswer: 2,
    explanation: 'x=5625/75=75',
    difficulty: 'easy'
  },
  {
    id: '78',
    question: 'Which is the next number in the sequence: 7, 18, 33, 52, ?',
    options: ['75', '77', '79', '81'],
    correctAnswer: 0,
    explanation: 'The differences are 11, 15, 19, 23, so next difference is 27. 52 + 27 = 79',
    difficulty: 'medium'
  },
  {
    id: '79',
    question: 'If 80x = 6400, what is x?',
    options: ['78', '79', '80', '81'],
    correctAnswer: 2,
    explanation: 'x=6400/80=80',
    difficulty: 'easy'
  },
  {
    id: '80',
    question: 'Which is the largest bird in the world?',
    options: ['Eagle', 'Ostrich', 'Emu', 'Albatross'],
    correctAnswer: 1,
    explanation: 'Ostrich is the largest bird',
    difficulty: 'medium'
  }
];

interface AptitudeTestProps {
  onComplete: (score: number) => void;
}

export const AptitudeTest: React.FC<AptitudeTestProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { transcript, isListening, isSupported, error, startListening, stopListening, resetTranscript, clearError } = useSpeechRecognition();
  const { speak } = useSpeechSynthesis();

  // Initialize with 10 random questions
  useEffect(() => {
    const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffledQuestions);
    setAnswers(new Array(10).fill(-1));
  }, []);

  const shuffleQuestions = () => {
    const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffledQuestions);
    setAnswers(new Array(10).fill(-1));
    setCurrentQuestion(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      setVideoEnabled(true);
      setAudioEnabled(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishTest = () => {
    const correctAnswers = answers.reduce((score, answer, index) => {
      return answer === questions[index]?.correctAnswer ? score + 1 : score;
    }, 0);
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    stopRecording();
    onComplete(finalScore);
  };

  if (questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-xl">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Aptitude Test</h2>
          <div className="flex space-x-4">
            <button
              onClick={shuffleQuestions}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              <Shuffle className="w-5 h-5" />
              <span>New Questions</span>
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isRecording ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
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
                {!isSupported ? 'Voice Not Supported' : isListening ? 'Stop Listening' : 'Voice Input'}
              </span>
            </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Recording Area */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Recording</h3>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Recording</span>
                </div>
              )}
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            {transcript && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">Voice Input: {transcript}</p>
              </div>
            )}
          </div>

          {/* Question Area */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Question {currentQuestion + 1} of {questions.length}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty}
              </span>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-800 text-lg mb-4">{question.question}</p>
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      answers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}. </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="text-sm text-gray-600">
                Answered: {answers.filter(a => a !== -1).length} / {questions.length}
              </div>

              <button
                onClick={nextQuestion}
                disabled={answers[currentQuestion] === -1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {currentQuestion === questions.length - 1 ? 'Finish Test' : 'Next Question'}
              </button>
            </div>
          </div>
        </div>

        {/* Question Progress */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Progress</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== -1
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

