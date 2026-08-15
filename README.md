# PDF Voice Reader 🎙️📄

A modern, high-performance React + Vite web application that enables users to upload PDF documents and listen to them via text-to-speech with **real-time, word-level karaoke highlighting** synchronized to the speech voice.

![PDF Voice Reader Preview](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- **100% Free & Client-Side**: Zero paid APIs, zero backend servers, zero API keys. Everything runs locally in your browser.
- **Precise Karaoke Word Highlighting**: Powered by `SpeechSynthesisUtterance.onboundary` mapped to PDF.js extracted text bounding boxes.
- **Section & Paragraph Detection**: Automatically detects logical paragraphs and renders inline 🔊 play buttons on the margin of each section.
- **Click-to-Speak**: Click **any word** on the PDF to immediately start reading from that exact point.
- **Multi-page PDF Rendering**: High-DPI canvas rendering with zoom controls (Fit width, 50%–250%).
- **Floating Playback Dock**:
  - Play / Pause / Resume / Stop controls
  - Skip to Next / Previous section
  - Live animated frequency audio visualizer waveform
  - Reading progress indicator & spoken word ticker
  - Quick speed presets (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`)
  - Voice selector dropdown
  - Continuous auto-reading mode
- **Customizable Experience**:
  - **4 Karaoke Themes**: Amber Gold, Electric Cyan, Emerald Mint, Neon Violet
  - **Voice & Pitch Customization**: Pitch, rate, volume, and voice selection with audio preview
  - **Dark / Light Theme Toggle**: Sleek glassmorphic dark mode and clean light mode
  - **Auto-scroll**: Smoothly keeps the active word centered in view
- **Built-in Sample Documents**: Includes pre-loaded multi-page sample PDFs for 1-click instant testing without needing to find a PDF file.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **PDF Engine**: [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`)
- **Speech Engine**: Web Speech API (`window.speechSynthesis` / `SpeechSynthesisUtterance`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Effects**: [canvas-confetti](https://github.com/catdad/canvas-confetti)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/engrshuvodas/PDF-READER.git

# Navigate to project directory
cd "PDF READER"

# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will start at `http://localhost:3000/`.

### Production Build

```bash
npm run build
```

The compiled static assets will be created in `dist/`, ready for deployment to any static hosting provider (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

---

## 🌐 Browser Compatibility

| Browser | Highlighting Sync | Notes |
| :--- | :--- | :--- |
| **Google Chrome** | ⭐⭐⭐⭐⭐ Ideal | Full `onboundary` character index accuracy |
| **Microsoft Edge** | ⭐⭐⭐⭐⭐ Ideal | Full `onboundary` character index accuracy |
| **Brave / Opera / Chromium** | ⭐⭐⭐⭐⭐ Ideal | Full `onboundary` character index accuracy |
| **Safari / WebKit** | ⭐⭐⭐ Basic | Speech works, boundary event timing is approximate |
| **Firefox** | ⭐⭐⭐ Basic | Speech works, boundary event timing is approximate |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause |
| `Escape` | Stop Playback |
| `Alt + Right Arrow` | Next Section |
| `Alt + Left Arrow` | Previous Section |

---

## 📄 License
MIT License