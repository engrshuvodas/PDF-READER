import React, { useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  FileText,
  Clock,
  Type,
  Edit3,
  Globe
} from 'lucide-react';

export default function TextViewer({
  documentStructure,
  activeSection,
  activeWord,
  playbackState,
  highlightColor,
  autoScroll,
  onPlaySection,
  onPause,
  onResume,
  onWordClick,
  onEditText
}) {
  const activeWordRef = useRef(null);

  // Auto-scroll to active word in text mode
  useEffect(() => {
    if (!autoScroll || !activeWord || !activeWord.id) return;

    const highlightElem = document.getElementById(`text-word-${activeWord.id}`);
    if (highlightElem) {
      highlightElem.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeWord, autoScroll]);

  if (!documentStructure || !documentStructure.isTextMode) {
    return null;
  }

  const sections = documentStructure.pages[0]?.sections || [];

  return (
    <div className="text-viewer-container">
      {/* Text Document Card */}
      <div className="text-document-card">
        {/* Document Header & Stats */}
        <div className="text-doc-header">
          <div className="text-doc-title-group">
            <div className="text-doc-icon-badge">
              <FileText size={18} />
            </div>
            <div className="text-doc-meta-info">
              <h2 className="text-doc-title">{documentStructure.title}</h2>
              <div className="text-doc-stats">
                <span className="stat-pill">
                  <Type size={12} />
                  {documentStructure.totalWords} words
                </span>
                <span className="stat-pill">
                  <Clock size={12} />
                  ~{documentStructure.estimatedReadingTimeMin} min read
                </span>
                <span className="stat-pill">
                  <Globe size={12} />
                  {sections.length} {sections.length === 1 ? 'paragraph' : 'paragraphs'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-doc-actions">
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={onEditText}
              title="Edit or paste new text"
            >
              <Edit3 size={14} />
              <span>Edit Text</span>
            </button>
          </div>
        </div>

        {/* Paragraphs List */}
        <div className="text-paragraphs-list">
          {sections.map((section, sIdx) => {
            const isCurrentSection = activeSection && activeSection.id === section.id;
            const isSectionPlaying = isCurrentSection && playbackState === 'playing';
            const isSectionPaused = isCurrentSection && playbackState === 'paused';

            return (
              <div
                key={section.id}
                className={`text-paragraph-card ${isCurrentSection ? 'active-reading-paragraph' : ''}`}
              >
                {/* Paragraph Inline 🔊 Play Button */}
                <button
                  type="button"
                  className={`section-play-btn inline-text-play-btn ${
                    isSectionPlaying ? 'playing' : ''
                  } ${isSectionPaused ? 'paused' : ''}`}
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
                      : 'Read paragraph aloud'
                  }
                  aria-label="Read paragraph"
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

                {/* Words Content Container with Clickable Spans & Karaoke Highlighting */}
                <p className="text-paragraph-body">
                  {section.words.map((word) => {
                    const isSpoken = activeWord && activeWord.id === word.id;

                    return (
                      <span
                        key={word.id}
                        id={`text-word-${word.id}`}
                        className={`text-word-span ${
                          isSpoken ? `active-spoken-word theme-${highlightColor}` : ''
                        }`}
                        onClick={() => onWordClick(section, word.index)}
                        title={`Click to read from "${word.text}"`}
                      >
                        {word.text}{' '}
                      </span>
                    );
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
