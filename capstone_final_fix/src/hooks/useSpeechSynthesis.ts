import { useState, useEffect, useCallback } from 'react';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
      
      const updateVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        console.log('Available voices:', availableVoices.length);
        setVoices(availableVoices);
      };

      // Load voices immediately if available
      updateVoices();
      
      // Also listen for the voiceschanged event
      speechSynthesis.addEventListener('voiceschanged', updateVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      };
    }
  }, []);

  const speak = useCallback((text: string, voiceIndex = 0, rate = 1, pitch = 1) => {
    if (!supported) {
      console.log('Speech synthesis not supported');
      return;
    }

    if (!text || text.trim() === '') {
      console.log('No text to speak');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
      
    // Use available voices or default
    const availableVoices = speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[voiceIndex] || availableVoices[0];
    }
      
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log('Speech started:', text.substring(0, 50) + '...');
      setSpeaking(true);
    };
      
    utterance.onend = () => {
      console.log('Speech ended');
      setSpeaking(false);
    };
      
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setSpeaking(false);
    };

    console.log('Starting speech synthesis for:', text.substring(0, 50) + '...');
    speechSynthesis.speak(utterance);
  }, [supported]);

  const cancel = useCallback(() => {
    console.log('Cancelling speech synthesis');
    speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return {
    speak,
    cancel,
    speaking,
    supported,
    voices
  };
};


