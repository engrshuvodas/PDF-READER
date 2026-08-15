import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  Play,
  AlertTriangle
} from 'lucide-react';
import { renderPageToCanvas } from '../services/pdfService';

export default function PdfViewer({
  pdfDoc,
  documentStructure,
  zoom,
  activeSection,
  activeWord,
  playbackState,
  highlightColor,
  autoScroll,
  onPlaySection,
  onPause,
  onResume,
  onStop,
  onWordClick
}) {
  const viewerContainerRef = useRef(null);

  // Auto-scroll to active word
  useEffect(() => {
    if (!autoScroll || !activeWord || !activeWord.id) return;

    const highlightElem = document.getElementById(`highlight-${activeWord.id}`);
    if (highlightElem) {
      highlightElem.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeWord, autoScroll]);

  if (!pdfDoc || !documentStructure) {
    return null;
  }

  return (
    <div className="pdf-viewer-container" ref={viewerContainerRef}>
      <div className="pdf-pages-track">
        {documentStructure.pages.map((pageInfo) => (
          <PdfPage
            key={`page-${pageInfo.pageNumber}`}
            pdfDoc={pdfDoc}
            pageInfo={pageInfo}
            zoom={zoom}
            activeSection={activeSection}
            activeWord={activeWord}
            playbackState={playbackState}
            highlightColor={highlightColor}
            onPlaySection={onPlaySection}
            onPause={onPause}
            onResume={onResume}
            onWordClick={onWordClick}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual PDF Page renderer with responsive canvas scaling, section overlays, and touch targets
 */
function PdfPage({
  pdfDoc,
  pageInfo,
  zoom,
  activeSection,
  activeWord,
  playbackState,
  highlightColor,
  onPlaySection,
  onPause,
  onResume,
  onWordClick
}) {
  const canvasRef = useRef(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    async function render() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setIsRendering(true);
        setRenderError(null);

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        const page = await pdfDoc.getPage(pageInfo.pageNumber);
        if (isCancelled) return;

        const result = await renderPageToCanvas(page, canvasRef.current, zoom);
        renderTaskRef.current = result.renderTask;
        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err) {
        if (!isCancelled && err.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageInfo.pageNumber} render failed:`, err);
          setRenderError(err.message);
          setIsRendering(false);
        }
      }
    }

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, pageInfo.pageNumber, zoom]);

  const pageWidthPx = pageInfo.width * zoom;
  const pageHeightPx = pageInfo.height * zoom;

  return (
    <div
      className="pdf-page-card"
      id={`page-card-${pageInfo.pageNumber}`}
      style={{
        width: `${pageWidthPx}px`,
        minHeight: `${pageHeightPx}px`
      }}
    >
      {/* Page Number Watermark */}
      <div className="page-header-indicator">
        <span className="page-badge">Page {pageInfo.pageNumber}</span>
      </div>

      {/* Scanned Image / No Text Notice */}
      {!pageInfo.hasText && (
        <div className="scanned-page-banner">
          <AlertTriangle size={14} />
          <span>No extractable text on this page (scanned image).</span>
        </div>
      )}

      {/* Canvas Element */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="pdf-canvas" />
        {isRendering && (
          <div className="page-rendering-skeleton">
            <div className="skeleton-pulse"></div>
          </div>
        )}
      </div>

      {/* Interactive Overlay Layer: Word Highlighting & Section Buttons */}
      <div
        className="interactive-overlay-layer"
        style={{
          width: `${pageWidthPx}px`,
          height: `${pageHeightPx}px`
        }}
      >
        {/* Sections and Section Controls */}
        {pageInfo.sections.map((section) => {
          const isCurrentSection = activeSection && activeSection.id === section.id;
          const isSectionPlaying = isCurrentSection && playbackState === 'playing';
          const isSectionPaused = isCurrentSection && playbackState === 'paused';

          return (
            <div
              key={section.id}
              className={`section-overlay-block ${isCurrentSection ? 'active-reading-section' : ''}`}
              style={{
                left: `${section.bounds.x * 100}%`,
                top: `${section.bounds.y * 100}%`,
                width: `${section.bounds.w * 100}%`,
                height: `${section.bounds.h * 100}%`
              }}
            >
              {/* Inline 🔊 Play Button */}
              <button
                className={`section-play-btn ${isSectionPlaying ? 'playing' : ''} ${isSectionPaused ? 'paused' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSectionPlaying) {
                    onPause();
                  } else if (isSectionPaused) {
                    onResume();
                  } else {
                    onPlaySection(section, 0);
                  }
                }}
                title={
                  isSectionPlaying
                    ? 'Pause reading'
                    : isSectionPaused
                    ? 'Resume reading'
                    : 'Read section aloud'
                }
                aria-label="Read section"
              >
                {isSectionPlaying ? (
                  <div className="soundwave-mini">
                    <span className="bar bar-1"></span>
                    <span className="bar bar-2"></span>
                    <span className="bar bar-3"></span>
                  </div>
                ) : isSectionPaused ? (
                  <Play size={13} />
                ) : (
                  <Volume2 size={13} />
                )}
                <span className="play-btn-tooltip">
                  {isSectionPlaying ? 'Pause' : 'Read Section'}
                </span>
              </button>
            </div>
          );
        })}

        {/* Word Hitboxes (for clicking any word to read from it) */}
        {pageInfo.sections.flatMap((section) =>
          section.words.map((word) => {
            const isSpokenWord = activeWord && activeWord.id === word.id;

            return (
              <div
                key={word.id}
                id={`word-hit-${word.id}`}
                className={`word-hitbox ${isSpokenWord ? 'current-spoken-hitbox' : ''}`}
                style={{
                  left: `${word.normBox.x * 100}%`,
                  top: `${word.normBox.y * 100}%`,
                  width: `${word.normBox.w * 100}%`,
                  height: `${word.normBox.h * 100}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(section, word.index);
                }}
                title={`Click to read: "${word.text}"`}
              />
            );
          })
        )}

        {/* Real-time Karaoke Word Highlight Marker */}
        {activeWord && activeWord.pageNumber === pageInfo.pageNumber && (
          <div
            id={`highlight-${activeWord.id}`}
            className={`karaoke-highlight-pill theme-${highlightColor}`}
            style={{
              left: `${activeWord.normBox.x * 100}%`,
              top: `${activeWord.normBox.y * 100}%`,
              width: `${activeWord.normBox.w * 100}%`,
              height: `${activeWord.normBox.h * 100}%`
            }}
          >
            <div className="highlight-glow-backdrop"></div>
          </div>
        )}
      </div>
    </div>
  );
}
