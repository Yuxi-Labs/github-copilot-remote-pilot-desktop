import { useState, useCallback, useRef, useEffect } from 'react';

// Check if running in Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

/**
 * Hook to use native Windows Speech Recognition via Tauri
 * No browser permission popup required!
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const listeningRef = useRef(false);

  // Check Tauri support after mount (when __TAURI__ is available)
  useEffect(() => {
    // Check immediately
    setIsSupported(isTauri());
    
    // Also check after a short delay in case Tauri initializes later
    const timer = setTimeout(() => {
      setIsSupported(isTauri());
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const startListening = useCallback(async () => {
    if (!isTauri()) {
      const msg = 'Voice input requires the desktop app';
      setError(msg);
      onError?.(msg);
      return;
    }

    if (listeningRef.current) {
      return;
    }

    listeningRef.current = true;
    setIsListening(true);
    setError(null);
    setInterimTranscript('Listening...');

    try {
      // Dynamically import Tauri invoke
      const { invoke } = await import('@tauri-apps/api/core');
      
      // Check if speech is available on this platform
      const available = await invoke<boolean>('is_speech_available');
      if (!available) {
        throw new Error('Speech recognition not available on this platform');
      }

      // Start native speech recognition
      const result = await invoke<string>('start_speech_recognition');
      
      if (result && result.trim()) {
        const newTranscript = transcript + result + ' ';
        setTranscript(newTranscript);
        setInterimTranscript('');
        onResult?.(newTranscript.trim());
      } else {
        setInterimTranscript('');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Don't show error if it was cancelled
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('Already listening')) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
      setInterimTranscript('');
    } finally {
      listeningRef.current = false;
      setIsListening(false);
    }
  }, [transcript, onResult, onError]);

  const stopListening = useCallback(async () => {
    if (!listeningRef.current) return;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('stop_speech_recognition');
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
    
    listeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
