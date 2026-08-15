import React from 'react';
import {
  FileText,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Volume2,
  Sparkles,
  Sliders,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../services/samplePdfs';

export default function Header({
  fileName,
  pageCount,
  currentPage,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUploadClick,
  onSelectSample,
  onOpenSettings,
  isDarkMode,
  onToggleTheme,
  browserSupport,
  isPlaying
}) {
  const [showSamplesDropdown, setShowSamplesDropdown] = React.useState(false);

  return (
    <header className="app-header">
      {/* Brand & Document Info */}
      <div className="header-left">
        <div className="app-logo">
          <div className={`logo-icon-wrapper ${isPlaying ? 'pulse-anim' : ''}`}>
            <Volume2 className="logo-icon" size={22} />
          </div>
          <div className="logo-text">
            <span className="logo-title">PDF Voice Reader</span>
            <span className="logo-badge">Karaoke TTS</span>
          </div>
        </div>

        {fileName && (
          <div className="doc-info-badge" title={fileName}>
            <FileText size={15} className="doc-icon" />
            <span className="doc-name">{fileName}</span>
            {pageCount > 0 && (
              <span className="doc-pages">
                {currentPage} / {pageCount} {pageCount === 1 ? 'page' : 'pages'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Controls: Upload & Samples */}
      <div className="header-center">
        <button className="btn btn-primary" onClick={onUploadClick}>
          <Upload size={16} />
          <span>Upload PDF</span>
        </button>

        <div className="dropdown-container">
          <button
            className="btn btn-secondary dropdown-trigger"
            onClick={() => setShowSamplesDropdown(!showSamplesDropdown)}
            onBlur={() => setTimeout(() => setShowSamplesDropdown(false), 200)}
          >
            <Sparkles size={16} className="text-accent" />
            <span>Sample PDFs</span>
            <ChevronDown size={14} className={`chevron ${showSamplesDropdown ? 'open' : ''}`} />
          </button>

          {showSamplesDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">Try instant sample documents:</div>
              {SAMPLE_DOCUMENTS.map((doc) => (
                <button
                  key={doc.id}
                  className="dropdown-item"
                  onClick={() => {
                    setShowSamplesDropdown(false);
                    onSelectSample(doc);
                  }}
                >
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{doc.name}</span>
                    <span className="dropdown-item-desc">{doc.description}</span>
                  </div>
                  <span className="dropdown-item-badge">{doc.badge}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom Controls (when document is loaded) */}
        {fileName && (
          <div className="zoom-controls">
            <button
              className="icon-btn"
              onClick={onZoomOut}
              disabled={zoom <= 0.6}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-value" onClick={onResetZoom} title="Click to reset zoom">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="icon-btn"
              onClick={onZoomIn}
              disabled={zoom >= 2.5}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={onResetZoom}
              title="Fit standard width"
              aria-label="Fit width"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: Browser Info, Settings & Theme */}
      <div className="header-right">
        {/* Browser compatibility status */}
        {browserSupport && (
          <div
            className={`browser-badge ${browserSupport.hasPreciseBoundary ? 'supported' : 'warning'}`}
            title={
              browserSupport.hasPreciseBoundary
                ? `${browserSupport.browserName}: Precise word boundary sync active`
                : `${browserSupport.browserName}: Boundary events may be approximate. Chrome/Edge recommended for ideal sync.`
            }
          >
            {browserSupport.hasPreciseBoundary ? (
              <>
                <CheckCircle2 size={13} />
                <span className="badge-text">{browserSupport.browserName} Sync Ready</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} />
                <span className="badge-text">Recommend Chrome</span>
              </>
            )}
          </div>
        )}

        {/* Audio / Voice Settings Modal Trigger */}
        <button className="icon-btn" onClick={onOpenSettings} title="Voice & Speech Settings" aria-label="Settings">
          <Sliders size={18} />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          className="icon-btn theme-toggle"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
