import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import PdfViewer from './components/PdfViewer';
import TextViewer from './components/TextViewer';
import PlaybackDock from './components/PlaybackDock';
import VoiceSettingsModal from './components/VoiceSettingsModal';
import PasteTextModal from './components/PasteTextModal';
import { loadPdfDocument, extractDocumentStructure } from './services/pdfService';
import { parseRawTextToDocument } from './services/textParserService';
import { SAMPLE_DOCUMENTS } from './services/samplePdfs';
import { useTTS } from './hooks/useTTS';

export default function App() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [documentStructure, setDocumentStructure] = useState(null);

  // Dynamic initial zoom
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w < 480) return 0.72;
      if (w < 768) return 0.88;
      if (w < 1024) return 1.05;
    }
    return 1.15;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasteTextOpen, setIsPasteTextOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const headerFileInputRef = useRef(null);

  // Celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.7 }
      });
    } catch (e) {}
  }, []);

  // Multi-Lingual TTS Hook
  const {
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
  } = useTTS({
    onPlaybackFinished: () => {
      triggerConfetti();
    }
  });

  // Handle dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Compute responsive auto-fit zoom
  const computeFitZoom = useCallback(() => {
    if (typeof window === 'undefined') return 1.15;
    const screenWidth = window.innerWidth;
    const targetDocWidth = 595.28;
    const availableWidth = Math.min(screenWidth - 48, 860);
    const fitScale = Math.max(0.5, Math.min(2.0, (availableWidth / targetDocWidth) * 0.95));
    return Math.round(fitScale * 100) / 100;
  }, []);

  // Load a PDF Document
  const handleLoadPdf = useCallback(
    async (source, name) => {
      try {
        setIsLoading(true);
        setError(null);
        stop();

        const doc = await loadPdfDocument(source);
        const structure = await extractDocumentStructure(doc);

        setPdfDoc(doc);
        setFileName(name);
        setDocumentStructure(structure);
        setCurrentPage(1);
        setZoom(computeFitZoom());

        const allSections = structure.pages.flatMap((p) => p.sections);
        setDocumentSections(allSections);

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err.message || 'Failed to parse PDF document. Please try another file.');
        setIsLoading(false);
      }
    },
    [stop, setDocumentSections, computeFitZoom]
  );

  // Load Custom Raw Text
  const handleLoadText = useCallback(
    (rawText, title = 'Custom Text Document') => {
      try {
        setIsLoading(true);
        setError(null);
        stop();

        const structure = parseRawTextToDocument(rawText, title);

        setPdfDoc(null); // Clear PDF proxy for text mode
        setFileName(title);
        setDocumentStructure(structure);
        setCurrentPage(1);

        const allSections = structure.pages[0].sections;
        setDocumentSections(allSections);

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to parse text:', err);
        setError(err.message || 'Failed to parse text document.');
        setIsLoading(false);
      }
    },
    [stop, setDocumentSections]
  );

  // File select handler (supports .pdf, .txt, .md)
  const handleFileSelect = (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          handleLoadText(text, file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsText(file);
    } else {
      handleLoadPdf(file, file.name);
    }
  };

  const handleSelectSample = (sampleDoc) => {
    const blob = sampleDoc.getBlob();
    handleLoadPdf(blob, `${sampleDoc.name}.pdf`);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Math.round((z + 0.12) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.45, Math.round((z - 0.12) * 100) / 100));
  const handleResetZoom = () => setZoom(computeFitZoom());

  const handleWordClick = (section, wordIndex) => {
    playSection(section, wordIndex);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stop();
      } else if (e.code === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        nextSection();
      } else if (e.code === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        prevSection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, stop, nextSection, prevSection]);

  const isTextMode = documentStructure?.isTextMode || false;
  const allSections = documentStructure
    ? documentStructure.pages.flatMap((p) => p.sections)
    : [];
  const currentSectionIndex = currentSection
    ? allSections.findIndex((s) => s.id === currentSection.id)
    : -1;

  const hasDocumentLoaded = !!documentStructure;

  return (
    <div className={`app-root ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={headerFileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        accept="application/pdf,.pdf,.txt,.text,.md"
        style={{ display: 'none' }}
      />

      {/* Navigation Header */}
      <Header
        fileName={fileName}
        pageCount={documentStructure?.numPages || 1}
        currentPage={currentPage}
        isTextMode={isTextMode}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onUploadClick={() => headerFileInputRef.current?.click()}
        onOpenPasteText={() => setIsPasteTextOpen(true)}
        onSelectSample={handleSelectSample}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        browserSupport={browserSupport}
        isPlaying={playbackState === 'playing'}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        {!hasDocumentLoaded ? (
          <UploadZone
            onFileSelect={handleFileSelect}
            onSelectSample={handleSelectSample}
            onOpenPasteText={() => setIsPasteTextOpen(true)}
            isLoading={isLoading}
            error={error}
          />
        ) : isTextMode ? (
          <TextViewer
            documentStructure={documentStructure}
            activeSection={currentSection}
            activeWord={activeWord}
            playbackState={playbackState}
            highlightColor={highlightColor}
            autoScroll={autoScroll}
            onPlaySection={playSection}
            onPause={pause}
            onResume={resume}
            onWordClick={handleWordClick}
            onEditText={() => setIsPasteTextOpen(true)}
          />
        ) : (
          <PdfViewer
            pdfDoc={pdfDoc}
            documentStructure={documentStructure}
            zoom={zoom}
            activeSection={currentSection}
            activeWord={activeWord}
            playbackState={playbackState}
            highlightColor={highlightColor}
            autoScroll={autoScroll}
            onPlaySection={playSection}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            onWordClick={handleWordClick}
          />
        )}
      </main>

      {/* Floating Bottom Playback Dock */}
      {hasDocumentLoaded && (
        <PlaybackDock
          currentSection={currentSection}
          totalSections={allSections.length}
          currentSectionIndex={currentSectionIndex}
          activeWord={activeWord}
          activeLanguage={activeLanguage}
          autoLanguageDetect={autoLanguageDetect}
          playbackState={playbackState}
          onPlay={() => {
            if (currentSection) {
              playSection(currentSection, 0);
            } else if (allSections.length > 0) {
              playSection(allSections[0], 0);
            }
          }}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onNext={nextSection}
          onPrev={prevSection}
          voices={voices}
          selectedVoiceURI={selectedVoiceURI}
          onSelectVoice={setSelectedVoiceURI}
          rate={rate}
          onChangeRate={setRate}
          autoPlayNext={autoPlayNext}
          onToggleAutoPlay={() => setAutoPlayNext(!autoPlayNext)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Paste & Type Custom Text Modal */}
      <PasteTextModal
        isOpen={isPasteTextOpen}
        onClose={() => setIsPasteTextOpen(false)}
        onSubmitText={handleLoadText}
        initialText={isTextMode ? documentStructure?.rawText || '' : ''}
      />

      {/* Voice & Language Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        onSelectVoice={setSelectedVoiceURI}
        preferredBanglaVoiceURI={preferredBanglaVoiceURI}
        onSelectBanglaVoice={setPreferredBanglaVoiceURI}
        preferredEnglishVoiceURI={preferredEnglishVoiceURI}
        onSelectEnglishVoice={setPreferredEnglishVoiceURI}
        autoLanguageDetect={autoLanguageDetect}
        onToggleAutoLanguageDetect={() => setAutoLanguageDetect(!autoLanguageDetect)}
        rate={rate}
        onChangeRate={setRate}
        pitch={pitch}
        onChangePitch={setPitch}
        volume={volume}
        onChangeVolume={setVolume}
        highlightColor={highlightColor}
        onChangeHighlightColor={setHighlightColor}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
        autoPlayNext={autoPlayNext}
        onToggleAutoPlay={() => setAutoPlayNext(!autoPlayNext)}
      />
    </div>
  );
}
