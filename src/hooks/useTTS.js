import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook for Web Speech API text-to-speech with word boundary synchronization
 */
export function useTTS({ onWordHighlight, onSectionChange, onPlaybackFinished } = {}) {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [rate, setRate] = useState(1.0); // 0.5 - 2.0
  const [pitch, setPitch] = useState(1.0); // 0.5 - 1.5
  const [volume, setVolume] = useState(1.0); // 0.0 - 1.0
  const [playbackState, setPlaybackState] = useState('idle'); // 'idle' | 'playing' | 'paused'
  
  const [currentSection, setCurrentSection] = useState(null);
  const [activeWordId, setActiveWordId] = useState(null);
  const [activeWord, setActiveWord] = useState(null);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [highlightColor, setHighlightColor] = useState('amber'); // amber, cyan, emerald, violet

  const [browserSupport, setBrowserSupport] = useState({
    supported: true,
    hasPreciseBoundary: true,
    browserName: 'Chrome'
  });

  const utteranceRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const allSectionsRef = useRef([]);
  const activeSectionRef = useRef(null);
  const charOffsetRef = useRef(0);
  const isPlayingRef = useRef(false);

  // 1. Detect browser and Web Speech support
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setBrowserSupport({
        supported: false,
        hasPreciseBoundary: false,
        browserName: 'Unsupported'
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
      hasPreciseBoundary = false; // Firefox has limited onboundary charIndex accuracy
    } else if (isSafari) {
      browserName = 'Apple Safari';
      hasPreciseBoundary = false;
    }

    setBrowserSupport({
      supported: true,
      hasPreciseBoundary,
      browserName
    });
  }, []);

  // 2. Load and sort available voices
  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const availableVoices = window.speechSynthesis.getVoices() || [];
    if (availableVoices.length === 0) return;

    // Sort: English voices first, then alphabetically
    const sorted = [...availableVoices].sort((a, b) => {
      const aIsEn = a.lang.startsWith('en');
      const bIsEn = b.lang.startsWith('en');
      if (aIsEn && !bIsEn) return -1;
      if (!aIsEn && bIsEn) return 1;
      return a.name.localeCompare(b.name);
    });

    setVoices(sorted);

    // Pick default voice if not yet selected
    if (!selectedVoiceURI && sorted.length > 0) {
      // Look for natural / premium English voice first
      const preferred = sorted.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Premium') ||
            v.name.includes('Online'))
      ) || sorted.find((v) => v.lang.startsWith('en')) || sorted[0];

      setSelectedVoiceURI(preferred.voiceURI);
    }
  }, [selectedVoiceURI]);

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

  // Keep references in sync
  useEffect(() => {
    isPlayingRef.current = playbackState === 'playing';
  }, [playbackState]);

  // Chrome Garbage Collection & Long Utterance Keepalive
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

  // Helper to find the word matching charIndex
  const findWordForCharIndex = (section, charIndex) => {
    if (!section || !section.words || section.words.length === 0) return null;

    // Exact match within [charStart, charEnd)
    for (let i = 0; i < section.words.length; i++) {
      const w = section.words[i];
      if (charIndex >= w.charStart && charIndex < w.charEnd) {
        return w;
      }
    }

    // If on boundary / space, find the closest word
    let closestWord = section.words[0];
    let minDistance = Infinity;

    for (let i = 0; i < section.words.length; i++) {
      const w = section.words[i];
      const dist = Math.abs(w.charStart - charIndex);
      if (dist < minDistance) {
        minDistance = dist;
        closestWord = w;
      }
    }

    return closestWord;
  };

  /**
   * Set the list of all document sections for next/prev navigation
   */
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
    setActiveWordId(null);
    setActiveWord(null);
    setPlaybackState('idle');
  }, []);

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

      // Determine text to read based on starting word
      let textToSpeak = section.text;
      let charOffset = 0;

      if (startWordIndex > 0 && startWordIndex < section.words.length) {
        const startWord = section.words[startWordIndex];
        charOffset = startWord.charStart;
        textToSpeak = section.text.slice(charOffset);
      }
      charOffsetRef.current = charOffset;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance;

      // Set voice
      const currentVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (currentVoice) {
        utterance.voice = currentVoice;
      }

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Word boundary event listener
      utterance.onboundary = (event) => {
        if (!activeSectionRef.current || activeSectionRef.current.id !== section.id) return;
        // event.name may be 'word' or undefined depending on browser
        const relativeCharIndex = event.charIndex || 0;
        const totalCharIndex = charOffsetRef.current + relativeCharIndex;

        const matchedWord = findWordForCharIndex(section, totalCharIndex);
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
        // Highlight the first word immediately upon starting
        const initialWord = section.words[startWordIndex] || section.words[0];
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
        stopHeartbeat();
        // Check if there is a next section and autoPlay is enabled
        if (autoPlayNext && allSectionsRef.current.length > 0) {
          const currentIdx = allSectionsRef.current.findIndex((s) => s.id === section.id);
          if (currentIdx !== -1 && currentIdx + 1 < allSectionsRef.current.length) {
            const nextSec = allSectionsRef.current[currentIdx + 1];
            // Brief timeout between sections for natural cadence
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
        if (onPlaybackFinished) {
          onPlaybackFinished();
        }
      };

      utterance.onerror = (event) => {
        console.error('SpeechSynthesis error:', event);
        stopHeartbeat();
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setPlaybackState('idle');
          setActiveWordId(null);
          setActiveWord(null);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [
      voices,
      selectedVoiceURI,
      rate,
      pitch,
      volume,
      autoPlayNext,
      stop,
      onWordHighlight,
      onSectionChange,
      onPlaybackFinished
    ]
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
        // If canceled or idle, replay from current section
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
