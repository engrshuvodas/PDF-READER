import React, { useState } from 'react';
import {
  X,
  Volume2,
  Sliders,
  Play,
  RotateCcw,
  Palette,
  Eye,
  Check,
  Globe,
  Languages
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
  preferredBanglaVoiceURI,
  onSelectBanglaVoice,
  preferredEnglishVoiceURI,
  onSelectEnglishVoice,
  autoLanguageDetect,
  onToggleAutoLanguageDetect,
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
  const [filterLang, setFilterLang] = useState('bn');
  const [previewSpeaking, setPreviewSpeaking] = useState(false);

  if (!isOpen) return null;

  const banglaVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('bn') ||
      v.name.toLowerCase().includes('bangla') ||
      v.name.toLowerCase().includes('bengali') ||
      v.name.includes('বাংলা')
  );

  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));

  const filteredVoices = voices.filter((v) => {
    if (filterLang === 'bn') {
      return (
        v.lang.toLowerCase().startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali') ||
        v.name.includes('বাংলা')
      );
    }
    if (filterLang === 'en') return v.lang.startsWith('en');
    return true;
  });

  const handleTestVoice = (type = 'en') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    let phrase = 'Hello! This is how English text will sound.';
    let voiceURI = preferredEnglishVoiceURI || selectedVoiceURI;
    let lang = 'en-US';

    if (type === 'bn') {
      phrase = 'নমস্কার! এটি বাংলা ভয়েস রিডারের একটি নমুনা অডিও।';
      voiceURI = preferredBanglaVoiceURI;
      lang = 'bn-BD';
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    const voiceObj = voices.find((v) => v.voiceURI === voiceURI);
    if (voiceObj) utterance.voice = voiceObj;
    utterance.lang = lang;
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
            <Languages size={22} className="text-primary" />
            <h3 className="modal-title">Language & Voice Settings (বাংলা ও ইংরেজি)</h3>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Section: Auto-Language Detection Toggle */}
          <div className="settings-card-highlight">
            <div className="toggle-row no-bg">
              <div className="toggle-label-text">
                <strong className="flex-center gap-6">
                  <Globe size={18} className="text-emerald" />
                  Auto-Detect Language & Switch Voices (স্বয়ংক্রিয় ভাষা পরিবর্তন)
                </strong>
                <span>
                  Automatically detects Bengali (বাংলা) vs English per word/sentence and reads with the appropriate voice.
                </span>
              </div>
              <input
                type="checkbox"
                className="toggle-switch"
                checked={autoLanguageDetect}
                onChange={onToggleAutoLanguageDetect}
              />
            </div>
          </div>

          {/* Section: Dual Voice Selectors for Auto Mode */}
          {autoLanguageDetect ? (
            <div className="settings-grid-2col">
              {/* Bengali Voice */}
              <div className="settings-group">
                <label className="settings-label">
                  <span className="lang-flag">🇧🇩</span>
                  <span>Bangla Voice (বাংলা কণ্ঠস্বর)</span>
                </label>
                <div className="voice-select-stacked">
                  <select
                    className="custom-select"
                    value={preferredBanglaVoiceURI}
                    onChange={(e) => onSelectBanglaVoice(e.target.value)}
                  >
                    {banglaVoices.length > 0 ? (
                      banglaVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))
                    ) : (
                      <option value="">Browser Default Bangla (bn-BD / bn-IN)</option>
                    )}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary test-voice-btn"
                    onClick={() => handleTestVoice('bn')}
                    disabled={previewSpeaking}
                  >
                    <Play size={13} />
                    <span>বাংলা শুনুন (Preview)</span>
                  </button>
                </div>
              </div>

              {/* English Voice */}
              <div className="settings-group">
                <label className="settings-label">
                  <span className="lang-flag">🌐</span>
                  <span>English Voice (ইংরেজি কণ্ঠস্বর)</span>
                </label>
                <div className="voice-select-stacked">
                  <select
                    className="custom-select"
                    value={preferredEnglishVoiceURI}
                    onChange={(e) => onSelectEnglishVoice(e.target.value)}
                  >
                    {englishVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary test-voice-btn"
                    onClick={() => handleTestVoice('en')}
                    disabled={previewSpeaking}
                  >
                    <Play size={13} />
                    <span>Listen English (Preview)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Manual Single Voice Selection */
            <div className="settings-group">
              <div className="settings-group-header">
                <label className="settings-label">
                  <Volume2 size={16} />
                  <span>Manual Voice Selector</span>
                </label>
                <div className="lang-filter-tabs">
                  <button
                    className={`tab-chip ${filterLang === 'bn' ? 'active' : ''}`}
                    onClick={() => setFilterLang('bn')}
                  >
                    বাংলা ({banglaVoices.length})
                  </button>
                  <button
                    className={`tab-chip ${filterLang === 'en' ? 'active' : ''}`}
                    onClick={() => setFilterLang('en')}
                  >
                    English ({englishVoices.length})
                  </button>
                  <button
                    className={`tab-chip ${filterLang === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterLang('all')}
                  >
                    All ({voices.length})
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
                  onClick={() => handleTestVoice(filterLang === 'bn' ? 'bn' : 'en')}
                  disabled={previewSpeaking}
                >
                  <Play size={14} className={previewSpeaking ? 'pulse-anim' : ''} />
                  <span>{previewSpeaking ? 'Speaking...' : 'Test Voice'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Speed & Pitch Sliders */}
          <div className="settings-grid-2col">
            {/* Speed Slider */}
            <div className="settings-group">
              <div className="slider-header">
                <label className="settings-label">Reading Speed (গতি)</label>
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
                <label className="settings-label">Voice Pitch (স্বরগ্রাম)</label>
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
                  <strong>Continuous Reading (ধারাবাহিক পাঠ)</strong>
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
