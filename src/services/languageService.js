/**
 * Language Detection & Multi-Lingual Speech Segmentation Service
 * Supports real-time switching between English, Bengali (বাংলা), and other languages.
 */

// Bengali Unicode Character Block: U+0980 to U+09FF
export const BENGALI_REGEX = /[\u0980-\u09FF]/;
export const LATIN_REGEX = /[a-zA-Z]/;

/**
 * Check if a string contains Bengali characters
 * @param {string} text
 * @returns {boolean}
 */
export function hasBengali(text) {
  return BENGALI_REGEX.test(text);
}

/**
 * Check if a string contains Latin/English characters
 * @param {string} text
 * @returns {boolean}
 */
export function hasLatin(text) {
  return LATIN_REGEX.test(text);
}

/**
 * Detect the primary language of a text string
 * @param {string} text
 * @returns {'bn-BD' | 'en-US' | 'neutral'}
 */
export function detectLanguage(text) {
  if (!text) return 'en-US';

  let bnCount = 0;
  let enCount = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0980 && code <= 0x09FF) {
      bnCount++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      enCount++;
    }
  }

  if (bnCount > 0 && bnCount >= enCount * 0.4) {
    return 'bn-BD';
  }
  if (enCount > 0) {
    return 'en-US';
  }
  return 'en-US';
}

/**
 * Segment a section into language-specific speech chunks for seamless multi-voice reading
 * e.g., ["Hello", "world", "স্বাগতম", "সবাইকে"] -> Segment 1 (en), Segment 2 (bn)
 *
 * @param {object} section
 * @param {number} startWordIndex
 * @returns {Array<object>} array of segments
 */
export function segmentSectionByLanguage(section, startWordIndex = 0) {
  if (!section || !section.words || section.words.length === 0) {
    return [];
  }

  const words = section.words.slice(startWordIndex);
  if (words.length === 0) return [];

  const segments = [];
  let currentSegmentWords = [];
  let currentLang = null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let wordLang = null;

    if (hasBengali(word.text)) {
      wordLang = 'bn-BD';
    } else if (hasLatin(word.text)) {
      wordLang = 'en-US';
    } else {
      // Punctuation / number: inherit from current segment or look ahead
      wordLang = currentLang || 'en-US';
    }

    if (!currentLang) {
      currentLang = wordLang;
      currentSegmentWords.push(word);
    } else if (currentLang === wordLang || (wordLang !== 'bn-BD' && wordLang !== 'en-US')) {
      currentSegmentWords.push(word);
    } else {
      // Language switch detected! Finalize previous segment
      if (currentSegmentWords.length > 0) {
        segments.push(createSegmentObject(currentSegmentWords, currentLang, section));
      }
      currentSegmentWords = [word];
      currentLang = wordLang;
    }
  }

  if (currentSegmentWords.length > 0) {
    segments.push(createSegmentObject(currentSegmentWords, currentLang || 'en-US', section));
  }

  return segments;
}

function createSegmentObject(segmentWords, lang, section) {
  const text = segmentWords.map((w) => w.text).join(' ');
  const startWord = segmentWords[0];
  const endWord = segmentWords[segmentWords.length - 1];

  return {
    lang,
    text,
    words: segmentWords,
    startWordIndex: startWord.index,
    endWordIndex: endWord.index,
    charOffset: startWord.charStart,
    sectionId: section.id
  };
}

/**
 * Find the most suitable SpeechSynthesisVoice for a target language
 * @param {Array<SpeechSynthesisVoice>} voices
 * @param {string} targetLang ('bn-BD', 'bn-IN', 'en-US', etc.)
 * @param {string} userPreferredVoiceURI
 * @returns {SpeechSynthesisVoice | null}
 */
export function findBestVoiceForLanguage(voices, targetLang, userPreferredVoiceURI = '') {
  if (!voices || voices.length === 0) return null;

  // If user selected a specific voice and it matches the target language, use it
  if (userPreferredVoiceURI) {
    const explicitVoice = voices.find((v) => v.voiceURI === userPreferredVoiceURI);
    if (explicitVoice) {
      if (
        (targetLang.startsWith('bn') && explicitVoice.lang.startsWith('bn')) ||
        (targetLang.startsWith('en') && explicitVoice.lang.startsWith('en'))
      ) {
        return explicitVoice;
      }
    }
  }

  // 1. Search for exact language match (e.g. bn-BD, bn-IN, en-US)
  if (targetLang.startsWith('bn')) {
    // Look for Bengali voices: Bangla (Bangladesh), Bangla (India), or names containing Bengali/Bangla
    const bnVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('bn') ||
          v.name.toLowerCase().includes('bangla') ||
          v.name.toLowerCase().includes('bengali') ||
          v.name.includes('বাংলা')
      ) || null;

    if (bnVoice) return bnVoice;
  } else {
    // English preference: Look for Natural / Google / Premium English voices
    const enVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Online') ||
            v.name.includes('Premium'))
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;

    if (enVoice) return enVoice;
  }

  // Fallback to first available voice
  return voices[0] || null;
}
