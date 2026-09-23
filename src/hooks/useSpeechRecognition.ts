import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers (Chrome, Edge, Safari, iOS Safari, etc.)
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = 'fa-IR', onResult, onError, onEnd } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false; // Capture speech utterances cleanly
        recognition.interimResults = true; // Live typing preview as user speaks
        recognition.lang = lang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
          isManuallyStoppedRef.current = false;
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0]?.transcript || '';
            if (result.isFinal) {
              currentFinal += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => {
              const updated = prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim();
              onResult?.(updated, true);
              return updated;
            });
            setInterimTranscript('');
          } else {
            setInterimTranscript(currentInterim);
            onResult?.(currentInterim, false);
          }
        };

        recognition.onerror = (event: any) => {
          const err = event.error || 'speech_recognition_error';
          let readable = '';
          switch (err) {
            case 'not-allowed':
            case 'service-not-allowed':
              readable = 'دسترسی به میکروفون داده نشد. لطفاً در تنظیمات مرورگر اجازه دسترسی به میکروفون را فعال کنید.';
              break;
            case 'no-speech':
              readable = 'صدایی شنیده نشد. دوباره تلاش کنید.';
              break;
            case 'network':
              readable = 'خطای اتصال به شبکه سرویس گفتار.';
              break;
            case 'audio-capture':
              readable = 'میکروفونی یافت نشد.';
              break;
            default:
              readable = `خطای صوتی (${err})`;
          }
          setErrorMessage(readable);
          onError?.(readable);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          onEnd?.();
        };

        recognitionRef.current = recognition;
      } catch (err) {
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, onResult, onError, onEnd]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    if (!recognitionRef.current) {
      setErrorMessage('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.');
      return;
    }

    try {
      isManuallyStoppedRef.current = false;
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      // If already started, restart
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch {
            // ignore
          }
        }, 80);
      } catch {
        // ignore
      }
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
