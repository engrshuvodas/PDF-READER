import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Volume2,
  Zap,
  ShieldCheck,
  ArrowRight,
  Type,
  Languages
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../services/samplePdfs';
import { SAMPLE_TEXT_SNIPPETS } from '../services/textParserService';

export default function UploadZone({
  onFileSelect,
  onSelectSample,
  onOpenPasteText,
  isLoading,
  error
}) {
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
      const name = file.name.toLowerCase();
      if (
        file.type === 'application/pdf' ||
        name.endsWith('.pdf') ||
        name.endsWith('.txt') ||
        name.endsWith('.md')
      ) {
        onFileSelect(file);
      } else {
        alert('Please drop a valid PDF or Text file (.pdf, .txt, .md)');
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
          <Languages size={14} className="hero-badge-icon text-emerald" />
          <span>বাংলা ও English • PDF & Text-to-Speech Karaoke</span>
        </div>
        <h1 className="hero-title">
          Listen to PDF & Custom Text with <br />
          <span className="gradient-text">Real-Time Word Highlighting</span>
        </h1>
        <p className="hero-subtitle">
          Upload any PDF or paste custom text in <strong>Bangla (বাংলা)</strong>, <strong>English</strong>, or mixed languages. 
          100% free, client-side, with zero backend or API keys required.
        </p>
      </div>

      {/* Main Action Cards: Upload PDF vs Paste Text */}
      <div className="upload-modes-grid">
        {/* Drop Zone for PDF / TXT */}
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
            accept="application/pdf,.pdf,.txt,.text,.md"
            style={{ display: 'none' }}
          />

          {isLoading ? (
            <div className="drop-zone-loading">
              <div className="spinner"></div>
              <p className="loading-text">Processing Document & Aligning Speech...</p>
              <span className="loading-sub">Analyzing typography, lines, and speech sections</span>
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon-container">
                <UploadCloud size={42} className="upload-icon" />
              </div>

              <h3 className="upload-prompt-title">
                {isDragOver ? 'Drop file here!' : 'Upload PDF or Text File'}
              </h3>
              <p className="upload-prompt-sub">Drag & drop or browse .pdf, .txt, .md</p>

              <button
                type="button"
                className="btn btn-primary upload-cta-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FileText size={16} />
                <span>Browse File</span>
              </button>
            </div>
          )}
        </div>

        {/* Paste Text Action Card */}
        <div className="paste-text-card" onClick={onOpenPasteText}>
          <div className="paste-text-icon-wrapper">
            <Type size={36} className="text-primary" />
          </div>
          <div className="paste-text-info">
            <h3 className="paste-text-title">Paste or Type Text</h3>
            <p className="paste-text-desc">
              Copy-paste any article, story, or notes in <strong>বাংলা</strong> or <strong>English</strong> to listen with karaoke highlighting.
            </p>
          </div>
          <button type="button" className="btn btn-secondary paste-cta-btn">
            <Type size={16} />
            <span>টেক্সট পেস্ট করুন (Paste Text)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p className="error-text">⚠️ {error}</p>
        </div>
      )}

      {/* Instant Sample Documents & Texts Section */}
      <div className="samples-section">
        <div className="samples-header">
          <span className="samples-tag">Instant Demos</span>
          <h4 className="samples-title">Try one of our interactive demo documents:</h4>
        </div>

        <div className="samples-grid">
          {/* PDF Samples */}
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="sample-card"
              onClick={() => onSelectSample(doc)}
            >
              <div className="sample-card-top">
                <div className="sample-card-badge">{doc.badge} PDF</div>
                <div className="sample-card-icon">
                  <Volume2 size={16} />
                </div>
              </div>
              <h5 className="sample-card-name">{doc.name}</h5>
              <p className="sample-card-desc">{doc.description}</p>
              <div className="sample-card-action">
                <span>Start Reading</span>
                <ArrowRight size={13} />
              </div>
            </div>
          ))}

          {/* Quick Mixed Bangla/English Text Snippet Sample */}
          <div
            className="sample-card sample-card-highlight"
            onClick={onOpenPasteText}
          >
            <div className="sample-card-top">
              <div className="sample-card-badge text-emerald">🇧🇩 বাংলা & EN</div>
              <div className="sample-card-icon">
                <Type size={16} />
              </div>
            </div>
            <h5 className="sample-card-name">Custom Text Reader</h5>
            <p className="sample-card-desc">
              Paste your own notes, news, or articles to read aloud instantly.
            </p>
            <div className="sample-card-action">
              <span>Open Text Reader</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Footer */}
      <div className="feature-highlights">
        <div className="feature-item">
          <Zap size={18} className="feature-icon text-amber" />
          <div className="feature-text">
            <strong>Karaoke Word Sync</strong>
            <span>Real-time word-by-word highlighted playback</span>
          </div>
        </div>

        <div className="feature-item">
          <Languages size={18} className="feature-icon text-primary" />
          <div className="feature-text">
            <strong>Bilingual Auto-Switch</strong>
            <span>Automatic voice switching for বাংলা and English</span>
          </div>
        </div>

        <div className="feature-item">
          <ShieldCheck size={18} className="feature-icon text-emerald" />
          <div className="feature-text">
            <strong>100% Client-Side Privacy</strong>
            <span>Runs in your browser with zero data uploaded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
