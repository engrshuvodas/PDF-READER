import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  Sliders,
  Repeat,
  Globe,
  ChevronUp
} from 'lucide-react';

const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 2.0];

export default function PlaybackDock({
  currentSection,
  totalSections,
  currentSectionIndex,
  activeWord,
  activeLanguage,
  autoLanguageDetect,
  playbackState,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNext,
  onPrev,
  voices,
  selectedVoiceURI,
  onSelectVoice,
  rate,
  onChangeRate,
  autoPlayNext,
  onToggleAutoPlay,
  onOpenSettings
}) {
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);

  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';
  const isIdle = playbackState === 'idle';

  const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);

  if (isIdle && !currentSection) {
    return null;
  }

  const currentSectionNum = currentSectionIndex >= 0 ? currentSectionIndex + 1 : 1;
  const progressPercent = totalSections > 0 ? (currentSectionNum / totalSections) * 100 : 0;

  const isCurrentBengali = activeLanguage && activeLanguage.startsWith('bn');

  return (
    <div className={`playback-dock-container ${isPlaying ? 'dock-active' : ''}`}>
      {/* Mini Progress Bar at Top of Dock */}
      <div className="dock-progress-track">
        <div
          className="dock-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="playback-dock-content">
        {/* Left: Section Info, Language Badge & Word Ticker */}
        <div className="dock-left">
          <div className="dock-soundwave-container">
            {isPlaying ? (
              <div className="soundwave-bars">
                <span className="wave-bar bar-1"></span>
                <span className="wave-bar bar-2"></span>
                <span className="wave-bar bar-3"></span>
                <span className="wave-bar bar-4"></span>
                <span className="wave-bar bar-5"></span>
              </div>
            ) : (
              <Volume2 size={20} className="text-muted" />
            )}
          </div>

          <div className="dock-meta">
            <div className="dock-meta-title">
              <span>
                Section {currentSectionNum} of {totalSections || 1}
              </span>
              {currentSection && (
                <span className="dock-page-tag">Page {currentSection.pageNumber}</span>
              )}
              {/* Language Active Indicator Badge */}
              <span className={`dock-lang-tag ${isCurrentBengali ? 'lang-bn' : 'lang-en'}`}>
                {isCurrentBengali ? '🇧🇩 বাংলা' : '🌐 English'}
              </span>
            </div>
            <div className="dock-word-preview" title={currentSection?.text}>
              {activeWord ? (
                <span className="current-word-highlight">"{activeWord.text}"</span>
              ) : (
                <span className="current-word-idle">
                  {isPlaying ? 'Reading...' : isPaused ? 'Paused' : 'Ready to read'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Main Playback Controls */}
        <div className="dock-center">
          {/* Previous Section */}
          <button
            className="dock-ctrl-btn"
            onClick={onPrev}
            disabled={currentSectionIndex <= 0}
            title="Previous Section"
            aria-label="Previous Section"
          >
            <SkipBack size={18} />
          </button>

          {/* Main Play/Pause Button */}
          <button
            className={`dock-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => {
              if (isPlaying) {
                onPause();
              } else if (isPaused) {
                onResume();
              } else {
                onPlay();
              }
            }}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="play-icon-offset" />}
          </button>

          {/* Stop Button */}
          <button
            className="dock-ctrl-btn"
            onClick={onStop}
            disabled={isIdle}
            title="Stop Playback (Esc)"
            aria-label="Stop"
          >
            <Square size={17} />
          </button>

          {/* Next Section */}
          <button
            className="dock-ctrl-btn"
            onClick={onNext}
            disabled={currentSectionIndex >= totalSections - 1}
            title="Next Section"
            aria-label="Next Section"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Right: Voice Quick Selector, Speed Chips & Language Mode */}
        <div className="dock-right">
          {/* Speed Preset Selector */}
          <div className="speed-selector-wrapper">
            <button
              className="dock-chip-btn"
              onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
              onBlur={() => setTimeout(() => setShowSpeedDropdown(false), 200)}
              title="Playback Speed"
            >
              <span>{rate}x</span>
              <ChevronUp size={12} className={`chevron ${showSpeedDropdown ? 'open' : ''}`} />
            </button>

            {showSpeedDropdown && (
              <div className="speed-dropdown-menu">
                <div className="dropdown-label">Playback Speed</div>
                {SPEED_PRESETS.map((s) => (
                  <button
                    key={s}
                    className={`speed-option ${rate === s ? 'active' : ''}`}
                    onClick={() => {
                      onChangeRate(s);
                      setShowSpeedDropdown(false);
                    }}
                  >
                    {s}x {s === 1.0 && '(Normal)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto Language / Voice Quick Button */}
          <div className="voice-selector-wrapper">
            <button
              className="dock-voice-btn"
              onClick={onOpenSettings}
              title={
                autoLanguageDetect
                  ? 'Auto-Language Detection Active (Bangla & English)'
                  : selectedVoice
                  ? selectedVoice.name
                  : 'Select Voice'
              }
            >
              <Globe size={14} className="text-primary" />
              <span className="voice-name-trim">
                {autoLanguageDetect
                  ? 'Auto Lang (EN/বাং)'
                  : selectedVoice
                  ? selectedVoice.name.replace(/(Google|Microsoft|Apple|Desktop)\s*/g, '').slice(0, 12)
                  : 'Voice'}
              </span>
            </button>
          </div>

          {/* Continuous Auto-Read Next Toggle */}
          <button
            className={`dock-toggle-btn ${autoPlayNext ? 'active' : ''}`}
            onClick={onToggleAutoPlay}
            title={
              autoPlayNext
                ? 'Continuous Reading: ON (Auto-advances to next section)'
                : 'Continuous Reading: OFF'
            }
          >
            <Repeat size={16} />
          </button>

          {/* Settings Modal Trigger */}
          <button
            className="dock-ctrl-btn"
            onClick={onOpenSettings}
            title="Fine-tune Bengali & English voices and audio"
            aria-label="Settings"
          >
            <Sliders size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
