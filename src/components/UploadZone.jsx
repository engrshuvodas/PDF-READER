import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Volume2,
  Zap,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../services/samplePdfs';

export default function UploadZone({ onFileSelect, onSelectSample, isLoading, error }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onFileSelect(file);
      } else {
        alert('Please drop a valid PDF file (.pdf)');
      }
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="upload-container">
      {/* Hero Welcome Section */}
      <div className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} className="hero-badge-icon" />
          <span>Real-time Karaoke Highlighting • Web Speech API</span>
        </div>
        <h1 className="hero-title">
          Listen to any PDF document with <br />
          <span className="gradient-text">Synchronized Voice Highlighting</span>
        </h1>
        <p className="hero-subtitle">
          Upload any PDF to follow along word-by-word with instant speech playback. 
          100% free, runs completely in your browser with zero backend or API keys required.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
        />

        {isLoading ? (
          <div className="drop-zone-loading">
            <div className="spinner"></div>
            <p className="loading-text">Processing PDF & Extracting Word Positions...</p>
            <span className="loading-sub">Analyzing typography, lines, and speech sections</span>
          </div>
        ) : (
          <div className="drop-zone-content">
            <div className="upload-icon-container">
              <UploadCloud size={48} className="upload-icon" />
              <div className="upload-icon-ring"></div>
            </div>

            <h3 className="upload-prompt-title">
              {isDragOver ? 'Drop PDF here now!' : 'Choose a PDF file or drag & drop it here'}
            </h3>
            <p className="upload-prompt-sub">Supports all standard PDF documents up to 50MB</p>

            <button
              type="button"
              className="btn btn-primary upload-cta-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileText size={17} />
              <span>Browse PDF File</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <p className="error-text">⚠️ {error}</p>
        </div>
      )}

      {/* Instant Sample Documents Section */}
      <div className="samples-section">
        <div className="samples-header">
          <span className="samples-tag">No PDF on hand?</span>
          <h4 className="samples-title">Try one of our interactive demo documents:</h4>
        </div>

        <div className="samples-grid">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="sample-card"
              onClick={() => onSelectSample(doc)}
            >
              <div className="sample-card-top">
                <div className="sample-card-badge">{doc.badge}</div>
                <div className="sample-card-icon">
                  <Volume2 size={18} />
                </div>
              </div>
              <h5 className="sample-card-name">{doc.name}</h5>
              <p className="sample-card-desc">{doc.description}</p>
              <div className="sample-card-action">
                <span>Start Reading</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights Footer */}
      <div className="feature-highlights">
        <div className="feature-item">
          <Zap size={18} className="feature-icon text-amber" />
          <div className="feature-text">
            <strong>Karaoke Word Sync</strong>
            <span>Precise word-level highlights synced with speech</span>
          </div>
        </div>

        <div className="feature-item">
          <Volume2 size={18} className="feature-icon text-primary" />
          <div className="feature-text">
            <strong>Section-by-Section Audio</strong>
            <span>Inline 🔊 play buttons for every paragraph</span>
          </div>
        </div>

        <div className="feature-item">
          <ShieldCheck size={18} className="feature-icon text-emerald" />
          <div className="feature-text">
            <strong>100% Client-Side Privacy</strong>
            <span>Your files never leave your computer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
