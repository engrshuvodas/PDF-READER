import React, { useState, useRef } from 'react';
import {
  X,
  Type,
  Sparkles,
  Volume2,
  Upload,
  Trash2,
  Copy,
  Globe
} from 'lucide-react';
import { SAMPLE_TEXT_SNIPPETS } from '../services/textParserService';
import { detectLanguage, hasBengali, hasLatin } from '../services/languageService';

export default function PasteTextModal({
  isOpen,
  onClose,
  onSubmitText,
  initialText = ''
}) {
  const [text, setText] = useState(initialText);
  const [title, setTitle] = useState('');
  const txtFileInputRef = useRef(null);

  if (!isOpen) return null;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const containsBn = hasBengali(text);
  const containsEn = hasLatin(text);

  let langTag = '🌐 English';
  if (containsBn && containsEn) {
    langTag = '🔀 Mixed (বাংলা ও English)';
  } else if (containsBn) {
    langTag = '🇧🇩 বাংলা (Bangla)';
  }

  const handleApplyTemplate = (snippet) => {
    setText(snippet.text);
    setTitle(snippet.title);
  };

  const handleTxtFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setText(content);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Please enter or paste some text first.');
      return;
    }
    onSubmitText(text, title.trim() || 'Pasted Text Document');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Hidden TXT File Input */}
        <input
          type="file"
          ref={txtFileInputRef}
          onChange={handleTxtFileUpload}
          accept=".txt,.text,.md"
          style={{ display: 'none' }}
        />

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Type size={20} className="text-primary" />
            <h3 className="modal-title">Paste & Read Text (টেক্সট লিখুন / পেস্ট করুন)</h3>
          </div>
          <button
            type="button"
            className="icon-btn modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Document Title Input */}
          <div className="text-input-group">
            <label className="settings-label">Document Title (ঐচ্ছিক শিরোনাম):</label>
            <input
              type="text"
              className="custom-text-input"
              placeholder="e.g. My Notes / আমার নোট"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Quick Snippet Chips */}
          <div className="quick-snippets-bar">
            <span className="snippets-label">
              <Sparkles size={13} className="text-accent" />
              <span>Try sample text:</span>
            </span>
            <div className="snippets-chips">
              {SAMPLE_TEXT_SNIPPETS.map((snippet) => (
                <button
                  key={snippet.id}
                  type="button"
                  className="snippet-chip"
                  onClick={() => handleApplyTemplate(snippet)}
                >
                  {snippet.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Textarea */}
          <div className="textarea-container">
            <textarea
              className="custom-textarea"
              rows={9}
              placeholder="Paste or type your text here in English, বাংলা (Bangla), or mixed languages...&#10;&#10;এখানে যেকোনো বাংলা বা ইংরেজি লেখা পেস্ট করুন..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>

          {/* Text Stats & Language Detector */}
          <div className="text-stats-bar">
            <div className="text-stats-left">
              <span className="stat-item">
                <strong>{wordCount}</strong> words
              </span>
              <span className="stat-item">
                <strong>{charCount}</strong> chars
              </span>
              {text.trim() && (
                <span className="stat-item text-primary font-bold">
                  {langTag}
                </span>
              )}
            </div>

            <div className="text-stats-actions">
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => txtFileInputRef.current?.click()}
                title="Upload .txt or .md file"
              >
                <Upload size={13} />
                <span>Upload .txt</span>
              </button>
              {text && (
                <button
                  type="button"
                  className="btn-ghost-sm text-dim"
                  onClick={() => {
                    setText('');
                    setTitle('');
                  }}
                  title="Clear text"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal Footer CTA */}
          <div className="modal-footer no-padding">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!text.trim()}
            >
              <Volume2 size={16} />
              <span>Read Aloud with Voice (ভয়েসে শুনুন)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
