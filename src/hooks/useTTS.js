import { useState, useEffect, useRef, useCallback } from 'react';
import {
  detectLanguage,
  segmentSectionByLanguage,
  findBestVoiceForLanguage,
  hasBengali
} from '../services/languageService';

/**
 * Custom Hook for Web Speech API text-to-speech with multi-language auto-switching
 * and real-time word boundary synchronization (supports English, Bengali / বাংলা, and mixed documents).
 */
export function useTTS({ onWordHighlight, onSectionChange, onPlaybackFinished } = {}) {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(''); // Specific manual voice or '' for auto
  const [preferredBanglaVoiceURI, setPreferredBanglaVoiceURI] = useState('');
  const [preferredEnglishVoiceURI, setPreferredEnglishVoiceURI] = useState('');
  const [autoLanguageDetect, setAutoLanguageDetect] = useState(true);

  const [rate, setRate] = useState(1.0); // 0.5 - 2.5
  const [pitch, setPitch] = useState(1.0); // 0.5 - 1.5
  const [volume, setVolume] = useState(1.0); // 0.0 - 1.0
  const [playbackState, setPlaybackState] = useState('idle'); // 'idle' | 'playing' | 'paused'
  
  const [currentSection, setCurrentSection] = useState(null);
  const [activeWordId, setActiveWordId] = useState(null);
  const [activeWord, setActiveWord] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('en-US');
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [highlightColor, setHighlightColor] = useState('amber'); // amber, cyan, emerald, violet

  const [browserSupport, setBrowserSupport] = useState({
    supported: true,
    hasPreciseBoundary: true,
    browserName: 'Chrome',
    hasBanglaVoice: false
  });

  const utteranceRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const allSectionsRef = useRef([]);
  const activeSectionRef = useRef(null);
  const segmentsQueueRef = useRef([]);
  const currentSegmentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // 1. Detect browser and Web Speech capabilities
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setBrowserSupport({
        supported: false,
        hasPreciseBoundary: false,
        browserName: 'Unsupported',
        hasBanglaVoice: false
      });
      return;
    }

    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg\//.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    let browserName = 'Browser';
    let hasPreciseBoundary = true;

    if (isEdge) {
      browserName = 'Microsoft Edge';
      hasPreciseBoundary = true;
    } else if (isChrome) {
      browserName = 'Google Chrome';
      hasPreciseBoundary = true;
    } else if (isFirefox) {
      browserName = 'Mozilla Firefox';
      hasPreciseBoundary = false;
    } else if (isSafari) {
      browserName = 'Apple Safari';
      hasPreciseBoundary = false;
    }

    setBrowserSupport((prev) => ({
      ...prev,
      supported: true,
      hasPreciseBoundary,
      browserName
    }));
  }, []);

  // 2. Load and sort available voices
  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const availableVoices = window.speechSynthesis.getVoices() || [];
    if (availableVoices.length === 0) return;

    // Sort: Bengali & English first, then others
    const sorted = [...availableVoices].sort((a, b) => {
      const aIsBn = a.lang.startsWith('bn');
      const bIsBn = b.lang.startsWith('bn');
      if (aIsBn && !bIsBn) return -1;
      if (!aIsBn && bIsBn) return 1;

      const aIsEn = a.lang.startsWith('en');
      const bIsEn = b.lang.startsWith('en');
      if (aIsEn && !bIsEn) return -1;
      if (!aIsEn && bIsEn) return 1;

      return a.name.localeCompare(b.name);
    });

    setVoices(sorted);

    const hasBn = sorted.some((v) => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
    setBrowserSupport((prev) => ({ ...prev, hasBanglaVoice: hasBn }));

    // Pick preferred Bengali voice
    if (!preferredBanglaVoiceURI) {
      const bnVoice = sorted.find((v) => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
      if (bnVoice) setPreferredBanglaVoiceURI(bnVoice.voiceURI);
    }

    // Pick preferred English voice
    if (!preferredEnglishVoiceURI) {
      const enVoice =
        sorted.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Online') ||
              v.name.includes('Premium'))
        ) || sorted.find((v) => v.lang.startsWith('en')) || sorted[0];

      if (enVoice) {
        setPreferredEnglishVoiceURI(enVoice.voiceURI);
        if (!selectedVoiceURI) setSelectedVoiceURI(enVoice.voiceURI);
      }
    }
  }, [selectedVoiceURI, preferredBanglaVoiceURI, preferredEnglishVoiceURI]);

  useEffect(() => {
    populateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [populateVoices]);

  useEffect(() => {
    isPlayingRef.current = playbackState === 'playing';
  }, [playbackState]);

  // Chrome Garbage Collection Keepalive
  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 12000);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  // Helper to find the word matching charIndex within a segment
  const findWordForCharIndexInSegment = (segment, charIndex) => {
    if (!segment || !segment.words || segment.words.length === 0) return null;

    // Exact match in word bounds
    for (let i = 0; i < segment.words.length; i++) {
      const w = segment.words[i];
      const relCharStart = w.charStart - segment.charOffset;
      const relCharEnd = w.charEnd - segment.charOffset;
      if (charIndex >= relCharStart && charIndex < relCharEnd) {
        return w;
      }
    }

    // Closest match
    let closestWord = segment.words[0];
    let minDistance = Infinity;

    for (let i = 0; i < segment.words.length; i++) {
      const w = segment.words[i];
      const relCharStart = w.charStart - segment.charOffset;
      const dist = Math.abs(relCharStart - charIndex);
      if (dist < minDistance) {
        minDistance = dist;
        closestWord = w;
      }
    }

    return closestWord;
  };

  const setDocumentSections = useCallback((sections) => {
    allSectionsRef.current = sections || [];
  }, []);

  /**
   * Stop any current playback cleanly
   */
  const stop = useCallback(() => {
    stopHeartbeat();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    activeSectionRef.current = null;
    segmentsQueueRef.current = [];
    currentSegmentIndexRef.current = 0;
    setActiveWordId(null);
    setActiveWord(null);
    setPlaybackState('idle');
  }, []);

  /**
   * Internal recursive function to play through segmented queue
   */
  const playNextSegment = useCallback(() => {
    const queue = segmentsQueueRef.current;
    const index = currentSegmentIndexRef.current;
    const section = activeSectionRef.current;

    if (!section || index >= queue.length) {
      stopHeartbeat();
      // Section finished: advance to next section if autoPlayNext is true
      if (autoPlayNext && allSectionsRef.current.length > 0) {
        const currentIdx = allSectionsRef.current.findIndex((s) => s.id === section.id);
        if (currentIdx !== -1 && currentIdx + 1 < allSectionsRef.current.length) {
          const nextSec = allSectionsRef.current[currentIdx + 1];
          setTimeout(() => {
            playSection(nextSec, 0);
          }, 350);
          return;
        }
      }

      // Finished all sections or no autoplay
      setActiveWordId(null);
      setActiveWord(null);
      setPlaybackState('idle');
      if (onPlaybackFinished) onPlaybackFinished();
      return;
    }

    const segment = queue[index];
    setActiveLanguage(segment.lang);

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utteranceRef.current = utterance;

    // Voice Selection: Auto-Detect Language or Manual Override
    let voiceToUse = null;
    if (autoLanguageDetect) {
      if (segment.lang.startsWith('bn')) {
        voiceToUse = findBestVoiceForLanguage(voices, 'bn-BD', preferredBanglaVoiceURI);
      } else {
        voiceToUse = findBestVoiceForLanguage(voices, 'en-US', preferredEnglishVoiceURI);
      }
    } else {
      voiceToUse = voices.find((v) => v.voiceURI === selectedVoiceURI) || null;
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    utterance.lang = segment.lang; // Ensures browser TTS synthesizer sets proper locale engine

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Word boundary event listener
    utterance.onboundary = (event) => {
      if (!activeSectionRef.current || activeSectionRef.current.id !== section.id) return;
      const relCharIndex = event.charIndex || 0;
      const matchedWord = findWordForCharIndexInSegment(segment, relCharIndex);

      if (matchedWord) {
        setActiveWordId(matchedWord.id);
        setActiveWord(matchedWord);
        if (onWordHighlight) {
          onWordHighlight(matchedWord, section);
        }
      }
    };

    utterance.onstart = () => {
      setPlaybackState('playing');
      startHeartbeat();

      const initialWord = segment.words[0];
      if (initialWord) {
        setActiveWordId(initialWord.id);
        setActiveWord(initialWord);
        if (onWordHighlight) {
          onWordHighlight(initialWord, section);
        }
      }
    };

    utterance.onpause = () => {
      setPlaybackState('paused');
      stopHeartbeat();
    };

    utterance.onresume = () => {
      setPlaybackState('playing');
      startHeartbeat();
    };

    utterance.onend = () => {
      currentSegmentIndexRef.current++;
      playNextSegment();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.error('SpeechSynthesis segment error:', event);
        currentSegmentIndexRef.current++;
        playNextSegment();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [
    voices,
    autoLanguageDetect,
    selectedVoiceURI,
    preferredBanglaVoiceURI,
    preferredEnglishVoiceURI,
    rate,
    pitch,
    volume,
    autoPlayNext,
    onWordHighlight,
    onPlaybackFinished
  ]);

  /**
   * Play a specific section, optionally starting from a specific word index
   */
  const playSection = useCallback(
    (section, startWordIndex = 0) => {
      if (!section || !section.words || section.words.length === 0) {
        console.warn('Attempted to play empty section');
        return;
      }

      if (typeof window === 'undefined' || !window.speechSynthesis) {
        alert('Web Speech API is not supported in this browser.');
        return;
      }

      // Cancel previous playback
      stop();

      activeSectionRef.current = section;
      setCurrentSection(section);
      if (onSectionChange) onSectionChange(section);

      // Segment section by language (English, Bengali, mixed)
      const segments = segmentSectionByLanguage(section, startWordIndex);
      segmentsQueueRef.current = segments;
      currentSegmentIndexRef.current = 0;

      playNextSegment();
    },
    [stop, playNextSegment, onSectionChange]
  );

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setPlaybackState('paused');
      stopHeartbeat();
    }
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlaybackState('playing');
        startHeartbeat();
      } else if (currentSection) {
        playSection(currentSection, 0);
      }
    }
  }, [currentSection, playSection]);

  /**
   * Toggle between Play and Pause
   */
  const togglePlayPause = useCallback(() => {
    if (playbackState === 'playing') {
      pause();
    } else if (playbackState === 'paused') {
      resume();
    } else if (currentSection) {
      playSection(currentSection, 0);
    } else if (allSectionsRef.current.length > 0) {
      playSection(allSectionsRef.current[0], 0);
    }
  }, [playbackState, currentSection, pause, resume, playSection]);

  /**
   * Jump to next section
   */
  const nextSection = useCallback(() => {
    if (!currentSection || allSectionsRef.current.length === 0) return;
    const currentIdx = allSectionsRef.current.findIndex((s) => s.id === currentSection.id);
    if (currentIdx !== -1 && currentIdx + 1 < allSectionsRef.current.length) {
      playSection(allSectionsRef.current[currentIdx + 1], 0);
    }
  }, [currentSection, playSection]);

  /**
   * Jump to previous section
   */
  const prevSection = useCallback(() => {
    if (!currentSection || allSectionsRef.current.length === 0) return;
    const currentIdx = allSectionsRef.current.findIndex((s) => s.id === currentSection.id);
    if (currentIdx > 0) {
      playSection(allSectionsRef.current[currentIdx - 1], 0);
    }
  }, [currentSection, playSection]);

  return {
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    preferredBanglaVoiceURI,
    setPreferredBanglaVoiceURI,
    preferredEnglishVoiceURI,
    setPreferredEnglishVoiceURI,
    autoLanguageDetect,
    setAutoLanguageDetect,
    activeLanguage,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    playbackState,
    currentSection,
    activeWordId,
    activeWord,
    autoPlayNext,
    setAutoPlayNext,
    highlightColor,
    setHighlightColor,
    browserSupport,
    setDocumentSections,
    playSection,
    pause,
    resume,
    stop,
    togglePlayPause,
    nextSection,
    prevSection
  };
}
