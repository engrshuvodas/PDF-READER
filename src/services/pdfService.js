import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker using local bundled or CDN fallback
if (typeof window !== 'undefined') {
  try {
    // Try using CDN worker matching pdfjs-dist version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  } catch (err) {
    console.warn('Failed to set PDF worker src from CDN, falling back:', err);
  }
}

/**
 * Load PDF Document from File, Blob, or ArrayBuffer
 * @param {File|Blob|ArrayBuffer|string} source
 * @returns {Promise<pdfjsLib.PDFDocumentProxy>}
 */
export async function loadPdfDocument(source) {
  let loadingTask;
  if (source instanceof File || source instanceof Blob) {
    const arrayBuffer = await source.arrayBuffer();
    loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
    loadingTask = pdfjsLib.getDocument({ data: source });
  } else if (typeof source === 'string') {
    loadingTask = pdfjsLib.getDocument(source);
  } else {
    throw new Error('Unsupported PDF source type');
  }

  const pdfDoc = await loadingTask.promise;
  return pdfDoc;
}

/**
 * Extract structured sections and word coordinates from all pages of a PDF document
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc
 * @returns {Promise<{ pages: Array, totalSections: number, totalWords: number }>}
 */
export async function extractDocumentStructure(pdfDoc) {
  const pages = [];
  let globalSectionCount = 0;
  let globalWordCount = 0;

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent({ includeMarkedContent: true });

    const pageResult = processPageTextContent(
      textContent,
      pageNum,
      viewport.width,
      viewport.height,
      globalSectionCount
    );

    pages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      hasText: pageResult.sections.length > 0 && pageResult.wordCount > 0,
      sections: pageResult.sections,
      wordCount: pageResult.wordCount
    });

    globalSectionCount += pageResult.sections.length;
    globalWordCount += pageResult.wordCount;
  }

  return {
    pages,
    numPages: pdfDoc.numPages,
    totalSections: globalSectionCount,
    totalWords: globalWordCount
  };
}

/**
 * Process a single page's text items into structured lines, paragraphs/sections, and word bounding boxes
 */
function processPageTextContent(textContent, pageNumber, pageWidth, pageHeight, startGlobalSectionIndex = 0) {
  const rawItems = textContent.items || [];
  if (rawItems.length === 0) {
    return { sections: [], wordCount: 0 };
  }

  // 1. Convert text items to normalized boxes
  const parsedItems = [];
  for (const item of rawItems) {
    if (!item.str || item.str.trim() === '') continue;

    // Transform matrix: [scaleX, skewY, skewX, scaleY, tx, ty]
    const tx = item.transform[4];
    const ty = item.transform[5];
    const itemHeight = Math.abs(item.transform[3]) || item.height || 12;
    const itemWidth = item.width || (item.str.length * itemHeight * 0.5);

    // In PDF coordinates, (0,0) is bottom-left. Convert to top-left coordinate system
    const normX = Math.max(0, tx / pageWidth);
    const normY = Math.max(0, (pageHeight - ty - itemHeight) / pageHeight);
    const normW = Math.min(1.0 - normX, itemWidth / pageWidth);
    const normH = Math.min(1.0 - normY, itemHeight / pageHeight);

    parsedItems.push({
      str: item.str,
      fontName: item.fontName,
      fontSize: itemHeight,
      normX,
      normY,
      normW,
      normH,
      bottomY: normY + normH
    });
  }

  if (parsedItems.length === 0) {
    return { sections: [], wordCount: 0 };
  }

  // 2. Sort items by vertical position (top to bottom), then horizontal (left to right)
  parsedItems.sort((a, b) => {
    // If vertical centers are close within ~50% font height, treat as same horizontal line
    const yDiff = a.normY - b.normY;
    const avgH = (a.normH + b.normH) / 2;
    if (Math.abs(yDiff) < avgH * 0.4) {
      return a.normX - b.normX;
    }
    return yDiff;
  });

  // 3. Group parsed items into visual lines
  const lines = [];
  let currentLine = [];
  let currentLineY = -1;
  let currentLineH = 0;

  for (const item of parsedItems) {
    if (currentLine.length === 0) {
      currentLine.push(item);
      currentLineY = item.normY;
      currentLineH = item.normH;
    } else {
      const yDiff = Math.abs(item.normY - currentLineY);
      if (yDiff < currentLineH * 0.45) {
        currentLine.push(item);
        currentLineH = Math.max(currentLineH, item.normH);
      } else {
        // Sort line items left to right
        currentLine.sort((a, b) => a.normX - b.normX);
        lines.push({
          items: currentLine,
          normY: currentLineY,
          normH: currentLineH,
          bottomY: currentLineY + currentLineH
        });
        currentLine = [item];
        currentLineY = item.normY;
        currentLineH = item.normH;
      }
    }
  }

  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.normX - b.normX);
    lines.push({
      items: currentLine,
      normY: currentLineY,
      normH: currentLineH,
      bottomY: currentLineY + currentLineH
    });
  }

  // 4. Group lines into paragraphs / sections
  const sectionGroups = [];
  let currentSectionLines = [];
  let prevLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!prevLine) {
      currentSectionLines.push(line);
      prevLine = line;
      continue;
    }

    const verticalGap = line.normY - prevLine.bottomY;
    const avgLineH = (prevLine.normH + line.normH) / 2;
    
    // Check if line spacing suggests a new paragraph (e.g. > 1.25x line height)
    // or if current section is getting quite long (> 70 words)
    const currentWordEst = currentSectionLines.reduce(
      (sum, l) => sum + l.items.reduce((s, it) => s + it.str.split(/\s+/).filter(Boolean).length, 0), 
      0
    );

    const isLargeGap = verticalGap > avgLineH * 0.9;
    const isTooLong = currentWordEst >= 60;

    if (isLargeGap || isTooLong) {
      sectionGroups.push(currentSectionLines);
      currentSectionLines = [line];
    } else {
      currentSectionLines.push(line);
    }

    prevLine = line;
  }

  if (currentSectionLines.length > 0) {
    sectionGroups.push(currentSectionLines);
  }

  // 5. Convert each section group into a Section with clean text and word bounding boxes
  const sections = [];
  let pageWordCount = 0;

  sectionGroups.forEach((secLines, secIdx) => {
    const rawWords = [];

    for (const line of secLines) {
      for (const item of line.items) {
        // Extract words with character sub-offsets
        const itemStr = item.str;
        // Match words and whitespace
        const regex = /\S+/g;
        let match;
        while ((match = regex.exec(itemStr)) !== null) {
          const wordText = match[0];
          const charStart = match.index;
          const charEnd = charStart + wordText.length;

          // Compute sub-item proportional horizontal position
          const startRatio = charStart / itemStr.length;
          const lengthRatio = wordText.length / itemStr.length;

          const wordNormX = item.normX + startRatio * item.normW;
          const wordNormW = Math.max(0.005, lengthRatio * item.normW);
          const wordNormY = item.normY;
          const wordNormH = item.normH;

          rawWords.push({
            text: wordText,
            normBox: {
              x: wordNormX,
              y: wordNormY,
              w: wordNormW,
              h: wordNormH
            }
          });
        }
      }
    }

    if (rawWords.length === 0) return;

    const sectionId = `sec-p${pageNumber}-${secIdx}`;
    const globalSectionIndex = startGlobalSectionIndex + sections.length;

    // Build the clean full speech string and exact charIndex map
    let speechText = '';
    const words = [];

    for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
      const rw = rawWords[wIdx];
      const charStart = speechText.length;
      speechText += (wIdx === 0 ? '' : ' ') + rw.text;
      const actualCharStart = wIdx === 0 ? 0 : charStart + 1;
      const actualCharEnd = actualCharStart + rw.text.length;

      const wordId = `${sectionId}-w${wIdx}`;
      words.push({
        id: wordId,
        index: wIdx,
        text: rw.text,
        cleanText: rw.text.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase(),
        charStart: actualCharStart,
        charEnd: actualCharEnd,
        pageNumber,
        sectionId,
        normBox: rw.normBox
      });
      pageWordCount++;
    }

    // Compute bounding box for entire section (for outline / indicator)
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const w of words) {
      minX = Math.min(minX, w.normBox.x);
      minY = Math.min(minY, w.normBox.y);
      maxX = Math.max(maxX, w.normBox.x + w.normBox.w);
      maxY = Math.max(maxY, w.normBox.y + w.normBox.h);
    }

    sections.push({
      id: sectionId,
      sectionIndex: secIdx,
      globalIndex: globalSectionIndex,
      pageNumber,
      text: speechText,
      words,
      bounds: {
        x: Math.max(0, minX - 0.01),
        y: Math.max(0, minY - 0.005),
        w: Math.min(1.0, (maxX - minX) + 0.02),
        h: Math.min(1.0, (maxY - minY) + 0.01)
      },
      // Position for the floating/margin 🔊 play button
      buttonPosition: {
        normX: Math.max(0.005, minX - 0.04),
        normY: Math.max(0.005, minY)
      }
    });
  });

  return {
    sections,
    wordCount: pageWordCount
  };
}

/**
 * Render a single PDF page to a canvas context with high-DPI scaling
 * @param {pdfjsLib.PDFPageProxy} page
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale
 * @returns {Promise<{ width: number, height: number, renderTask: any }>}
 */
export async function renderPageToCanvas(page, canvas, scale = 1.2) {
  const dpr = window.devicePixelRatio || 1.5;
  const viewport = page.getViewport({ scale: scale * dpr });
  const displayViewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(displayViewport.width)}px`;
  canvas.style.height = `${Math.floor(displayViewport.height)}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  const renderTask = page.render(renderContext);
  await renderTask.promise;

  return {
    width: displayViewport.width,
    height: displayViewport.height,
    viewport: displayViewport
  };
}
