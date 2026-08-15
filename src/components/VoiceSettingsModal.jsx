import React, { useState } from 'react';
import {
  X,
  Volume2,
  Sliders,
  Sparkles,
  Play,
  RotateCcw,
  Palette,
  Eye,
  Check
} from 'lucide-react';

const HIGHLIGHT_THEMES = [
  { id: 'amber', name: 'Amber Gold', color: '#fbbf24', border: '#f59e0b' },
  { id: 'cyan', name: 'Electric Cyan', color: '#38bdf8', border: '#0284c7' },
  { id: 'emerald', name: 'Emerald Mint', color: '#34d399', border: '#059669' },
  { id: 'violet', name: 'Neon Violet', color: '#c084fc', border: '#9333ea' }
];

export default function VoiceSettingsModal({
  isOpen,
  onClose,
  voices,
  selectedVoiceURI,
  onSelectVoice,
  rate,
  onChangeRate,
  pitch,
  onChangePitch,
  volume,
  onChangeVolume,
  highlightColor,
  onChangeHighlightColor,
  autoScroll,
  onToggleAutoScroll,
  autoPlayNext,
  onToggleAutoPlay
}) {
  const [filterLang, setFilterLang] = useState('en');
  const [previewSpeaking, setPreviewSpeaking] = useState(false);

  if (!isOpen) return null;

  const filteredVoices = voices.filter((v) => {
    if (filterLang === 'en') return v.lang.startsWith('en');
    if (filterLang === 'all') return true;
    return v.lang.startsWith(filterLang);
  });

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      'Hello! This is how text will sound with real-time word highlighting.'
    );
    const voiceObj = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    setPreviewSpeaking(true);
    utterance.onend = () => setPreviewSpeaking(false);
    utterance.onerror = () => setPreviewSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sliders size={20} className="text-primary" />
            <h3 className="modal-title">Voice & Playback Settings</h3>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Section: Voice Selection */}
          <div className="settings-group">
            <div className="settings-group-header">
              <label className="settings-label">
                <Volume2 size={16} />
                <span>Text-to-Speech Voice</span>
              </label>
              <div className="lang-filter-tabs">
                <button
                  className={`tab-chip ${filterLang === 'en' ? 'active' : ''}`}
                  onClick={() => setFilterLang('en')}
                >
                  English Voices ({voices.filter((v) => v.lang.startsWith('en')).length})
                </button>
                <button
                  className={`tab-chip ${filterLang === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterLang('all')}
                >
                  All Languages ({voices.length})
                </button>
              </div>
            </div>

            <div className="voice-select-container">
              <select
                className="custom-select"
                value={selectedVoiceURI}
                onChange={(e) => onSelectVoice(e.target.value)}
              >
                {filteredVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-secondary test-voice-btn"
                onClick={handleTestVoice}
                disabled={previewSpeaking}
              >
                <Play size={14} className={previewSpeaking ? 'pulse-anim' : ''} />
                <span>{previewSpeaking ? 'Speaking...' : 'Test Voice'}</span>
              </button>
            </div>
          </div>

          {/* Section: Speed & Pitch Sliders */}
          <div className="settings-grid-2col">
            {/* Speed Slider */}
            <div className="settings-group">
              <div className="slider-header">
                <label className="settings-label">Reading Speed</label>
                <div className="slider-value-display">
                  <span>{rate.toFixed(2)}x</span>
                  {rate !== 1.0 && (
                    <button
                      className="slider-reset-btn"
                      onClick={() => onChangeRate(1.0)}
                      title="Reset to 1.0x"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                className="custom-range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={rate}
                onChange={(e) => onChangeRate(parseFloat(e.target.value))}
              />
              <div className="range-marks">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>2.5x Fast</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="settings-group">
              <div className="slider-header">
                <label className="settings-label">Voice Pitch</label>
                <div className="slider-value-display">
                  <span>{pitch.toFixed(2)}</span>
                  {pitch !== 1.0 && (
                    <button
                      className="slider-reset-btn"
                      onClick={() => onChangePitch(1.0)}
                      title="Reset to 1.0"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                className="custom-range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={pitch}
                onChange={(e) => onChangePitch(parseFloat(e.target.value))}
              />
              <div className="range-marks">
                <span>Deeper</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>
          </div>

          {/* Section: Highlight Color Scheme */}
          <div className="settings-group">
            <label className="settings-label">
              <Palette size={16} />
              <span>Karaoke Highlight Color Theme</span>
            </label>
            <div className="theme-color-picker">
              {HIGHLIGHT_THEMES.map((th) => (
                <button
                  key={th.id}
                  className={`theme-color-card ${highlightColor === th.id ? 'active' : ''}`}
                  onClick={() => onChangeHighlightColor(th.id)}
                  style={{
                    '--theme-bg': th.color,
                    '--theme-border': th.border
                  }}
                >
                  <span
                    className="color-dot"
                    style={{ backgroundColor: th.color, borderColor: th.border }}
                  >
                    {highlightColor === th.id && <Check size={12} color="#000" />}
                  </span>
                  <span className="theme-name">{th.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Reading Options */}
          <div className="settings-group">
            <label className="settings-label">
              <Eye size={16} />
              <span>Reading Behavior</span>
            </label>
            <div className="toggle-options-list">
              <label className="toggle-row">
                <div className="toggle-label-text">
                  <strong>Auto-scroll Document</strong>
                  <span>Keep the currently spoken word smoothly centered in view</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle-switch"
                  checked={autoScroll}
                  onChange={onToggleAutoScroll}
                />
              </label>

              <label className="toggle-row">
                <div className="toggle-label-text">
                  <strong>Continuous Reading</strong>
                  <span>Automatically advance to the next section when reading finishes</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle-switch"
                  checked={autoPlayNext}
                  onChange={onToggleAutoPlay}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
