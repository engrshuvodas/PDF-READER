/**
 * Text Document Parser Service
 * Converts raw pasted or typed text into structured sections and words
 * for synchronized Web Speech API playback and word-level karaoke highlighting.
 */

import { detectLanguage } from './languageService';

export function parseRawTextToDocument(rawText, title = 'Custom Text Document') {
  if (!rawText || rawText.trim() === '') {
    throw new Error('Please enter or paste some text to read.');
  }

  const cleanText = rawText.trim();
  // Split text by blank lines or multiple newlines into paragraphs
  const rawParagraphs = cleanText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sections = [];
  let globalWordCount = 0;
  let totalCharCount = 0;

  rawParagraphs.forEach((paraText, pIdx) => {
    // Break paragraph into individual words with exact character offsets
    const regex = /\S+/g;
    let match;
    const rawWords = [];

    while ((match = regex.exec(paraText)) !== null) {
      rawWords.push({
        text: match[0],
        charStartInPara: match.index
      });
    }

    if (rawWords.length === 0) return;

    const sectionId = `text-sec-${pIdx}`;
    let speechText = '';
    const words = [];

    for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
      const rw = rawWords[wIdx];
      const charStart = speechText.length;
      speechText += (wIdx === 0 ? '' : ' ') + rw.text;
      const actualCharStart = wIdx === 0 ? 0 : charStart + 1;
      const actualCharEnd = actualCharStart + rw.text.length;

      const wordId = `${sectionId}-w${wIdx}`;
      words.push({
        id: wordId,
        index: wIdx,
        text: rw.text,
        cleanText: rw.text.replace(/^[^\w\u0980-\u09FF]+|[^\w\u0980-\u09FF]+$/g, '').toLowerCase(),
        charStart: actualCharStart,
        charEnd: actualCharEnd,
        pageNumber: 1,
        sectionId
      });
      globalWordCount++;
    }

    totalCharCount += speechText.length;
    const detectedLang = detectLanguage(speechText);

    sections.push({
      id: sectionId,
      sectionIndex: pIdx,
      globalIndex: pIdx,
      pageNumber: 1,
      text: speechText,
      words,
      lang: detectedLang
    });
  });

  return {
    isTextMode: true,
    title,
    rawText: cleanText,
    totalSections: sections.length,
    totalWords: globalWordCount,
    totalCharacters: totalCharCount,
    estimatedReadingTimeMin: Math.max(1, Math.ceil(globalWordCount / 130)),
    pages: [
      {
        pageNumber: 1,
        sections,
        wordCount: globalWordCount,
        hasText: globalWordCount > 0
      }
    ]
  };
}

export const SAMPLE_TEXT_SNIPPETS = [
  {
    id: 'sample-bn-tech',
    title: 'বাংলা ও ইংরেজি প্রযুক্তি সংবাদ (Mixed)',
    text: `Artificial Intelligence (AI) এখন মানুষের দৈনন্দিন জীবনের অবিচ্ছেদ্য অংশ হয়ে দাঁড়িয়েছে। বিশেষ করে Text-to-Speech প্রযুক্তির মাধ্যমে যেকোনো লিখিত তথ্যকে মানুষের মতো স্পষ্ট কণ্ঠে রূপান্তর করা যায়।

PDF Voice Reader অ্যাপ্লিকেশনটিতে বাংলা এবং ইংরেজি উভয় ভাষার লেখাই একসাথে পড়া যায়। This means you can easily listen to mixed bilingual articles, educational notes, and books without manual language switching.

স্মার্ট ভয়েস অ্যাসিস্ট্যান্টের মাধ্যমে সময় বাঁচান এবং পড়ার ক্লান্তি দূর করুন। Happy reading and listening!`
  },
  {
    id: 'sample-bn-story',
    title: 'ছোট গল্প: নীল আকাশের তারা (Pure Bangla)',
    text: `রাতের শান্ত আকাশে মিটিমিটি করে জ্বলছে অসংখ্য তারা। প্রতিটি তারার নিজস্ব একটি গল্প আছে, যা কোটি কোটি আলোকবর্ষ দূর থেকে আমাদের কাছে পৌঁছায়।

ছোট্ট নদীটির পাড়ে বসে দূর দিগন্তের দিকে তাকালে মন এক অদ্ভুত প্রশান্তিতে ভরে ওঠে। বাতাস ধীরে ধীরে বয়ে যায় গাছের পাতার ফাঁক দিয়ে, যেন প্রকৃতির এক মধুর সুর বাজছে চারিদিকে।

প্রকৃতির এই রূপ আমাদের স্মরণ করিয়ে দেয় যে জীবন কত সুন্দর এবং বৈচিত্র্যময়।`
  },
  {
    id: 'sample-en-speech',
    title: 'The Power of Listening (Pure English)',
    text: `Listening to text while reading simultaneously engages multiple cognitive pathways in the human brain. This dual-modality approach significantly boosts information retention, enhances focus, and makes long documents effortless to consume.

Whether you are studying complex scientific papers, preparing for presentations, or simply enjoying your favorite stories, synchronized word-by-word speech synthesis gives you the best reading experience.`
  }
];
