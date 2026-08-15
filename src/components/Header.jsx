import React, { useState } from 'react';
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
  ChevronDown,
  Languages,
  Type
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../services/samplePdfs';

export default function Header({
  fileName,
  pageCount,
  currentPage,
  isTextMode,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUploadClick,
  onOpenPasteText,
  onSelectSample,
  onOpenSettings,
  isDarkMode,
  onToggleTheme,
  browserSupport,
  isPlaying
}) {
  const [showSamplesDropdown, setShowSamplesDropdown] = useState(false);

  return (
    <header className="app-header">
      {/* Brand & Document Info */}
      <div className="header-left">
        <div className="app-logo" onClick={onResetZoom} title="PDF Voice Reader">
          <div className={`logo-icon-wrapper ${isPlaying ? 'pulse-anim' : ''}`}>
            <Volume2 className="logo-icon" size={20} />
          </div>
          <div className="logo-text">
            <span className="logo-title">PDF Voice</span>
            <span className="logo-badge">বাং • EN</span>
          </div>
        </div>

        {fileName && (
          <div className="doc-info-badge" title={fileName}>
            {isTextMode ? (
              <Type size={14} className="doc-icon" />
            ) : (
              <FileText size={14} className="doc-icon" />
            )}
            <span className="doc-name">{fileName}</span>
            {pageCount > 0 && !isTextMode && (
              <span className="doc-pages">
                {currentPage}/{pageCount}p
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Controls: Upload, Paste Text, Samples & Zoom */}
      <div className="header-center">
        {/* Upload File Button */}
        <button
          type="button"
          className="btn btn-primary btn-compact"
          onClick={onUploadClick}
          title="Upload PDF or Text File"
        >
          <Upload size={14} />
          <span className="hide-on-mobile">Upload</span>
        </button>

        {/* Paste Text Button */}
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          onClick={onOpenPasteText}
          title="Paste custom text (টেক্সট পেস্ট করুন)"
        >
          <Type size={14} className="text-primary" />
          <span className="hide-on-mobile">Paste Text</span>
        </button>

        {/* Samples Dropdown */}
        <div className="dropdown-container">
          <button
            type="button"
            className="btn btn-secondary btn-compact dropdown-trigger"
            onClick={() => setShowSamplesDropdown(!showSamplesDropdown)}
            onBlur={() => setTimeout(() => setShowSamplesDropdown(false), 250)}
            title="Try Demo Samples"
          >
            <Sparkles size={14} className="text-accent" />
            <span className="hide-on-sm">Samples</span>
            <ChevronDown size={12} className={`chevron ${showSamplesDropdown ? 'open' : ''}`} />
          </button>

          {showSamplesDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">Try instant sample documents:</div>
              {SAMPLE_DOCUMENTS.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
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

        {/* Zoom Controls (visible for PDF mode) */}
        {fileName && !isTextMode && (
          <div className="zoom-controls hide-on-xs">
            <button
              type="button"
              className="icon-btn zoom-btn"
              onClick={onZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="zoom-value" onClick={onResetZoom} title="Reset zoom">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="icon-btn zoom-btn"
              onClick={onZoomIn}
              disabled={zoom >= 2.5}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              className="icon-btn zoom-btn hide-on-sm"
              onClick={onResetZoom}
              title="Fit Width"
              aria-label="Fit width"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: Settings, Status & Theme */}
      <div className="header-right">
        {/* Browser compatibility status (Desktop & Tablet) */}
        {browserSupport && (
          <div
            className={`browser-badge hide-on-sm ${
              browserSupport.hasPreciseBoundary ? 'supported' : 'warning'
            }`}
            title={
              browserSupport.hasPreciseBoundary
                ? `${browserSupport.browserName}: Precise word sync active`
                : `${browserSupport.browserName}: Boundary events may be approximate.`
            }
          >
            {browserSupport.hasPreciseBoundary ? (
              <>
                <CheckCircle2 size={12} />
                <span className="badge-text">Sync Ready</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                <span className="badge-text">Chrome Recommended</span>
              </>
            )}
          </div>
        )}

        {/* Audio / Voice Settings Modal Trigger */}
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          title="Voice & Language Settings (বাংলা ও ইংরেজি)"
          aria-label="Settings"
        >
          <Languages size={16} className="text-primary" />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          className="icon-btn theme-toggle"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
