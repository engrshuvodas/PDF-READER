/**
 * Sample PDF Generator
 * Generates standard compliant PDF binary Blobs entirely in pure JavaScript
 * to provide instant, zero-friction sample documents for testing without needing to upload a file.
 */

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Creates a raw standard PDF 1.4 document Blob from a title and array of page paragraphs
 */
function createPdfBlob(docTitle, pagesData) {
  // A standard minimal PDF structure with Helvetica font
  const objects = [];
  let objCount = 0;

  function addObj(content) {
    objCount++;
    objects.push({ id: objCount, content });
    return objCount;
  }

  // 1. Catalog
  const catalogId = 1;
  // 2. Pages
  const pagesId = 2;
  // 3. Font Helvetica
  const fontId = 3;

  objCount = 3; // reserve 1, 2, 3

  const pageObjectIds = [];

  pagesData.forEach((page) => {
    // Generate text stream for page
    // Page dimensions: 595.28 x 841.89 (Standard A4 in points)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 54;
    const contentWidth = pageWidth - margin * 2;

    let stream = '';
    let currentY = pageHeight - margin - 30;

    // Page Header / Title
    if (page.title) {
      stream += `BT\n/F1 20 Tf\n0.15 0.23 0.45 rg\n${margin} ${currentY} Td\n(${escapePdfText(page.title)}) Tj\nET\n`;
      currentY -= 35;
    }

    if (page.subtitle) {
      stream += `BT\n/F1 12 Tf\n0.40 0.45 0.55 rg\n${margin} ${currentY} Td\n(${escapePdfText(page.subtitle)}) Tj\nET\n`;
      currentY -= 25;
    }

    // Divider line
    stream += `0.85 0.88 0.92 RG 1.5 w\n${margin} ${currentY + 10} m ${pageWidth - margin} ${currentY + 10} l S\n`;
    currentY -= 15;

    // Paragraphs
    page.paragraphs.forEach((p) => {
      if (p.heading) {
        currentY -= 10;
        stream += `BT\n/F1 14 Tf\n0.2 0.25 0.35 rg\n${margin} ${currentY} Td\n(${escapePdfText(p.heading)}) Tj\nET\n`;
        currentY -= 20;
      }

      // Word wrapping for paragraph body
      const words = p.body.split(/\s+/);
      const lines = [];
      let currentLine = '';
      const maxCharsPerLine = 72;

      words.forEach((w) => {
        if ((currentLine + ' ' + w).trim().length > maxCharsPerLine) {
          lines.push(currentLine.trim());
          currentLine = w + ' ';
        } else {
          currentLine += w + ' ';
        }
      });
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // Render lines
      stream += `BT\n/F1 11 Tf\n0.2 0.2 0.22 rg\n${margin} ${currentY} Td\n15 TL\n`;
      lines.forEach((line, idx) => {
        if (idx === 0) {
          stream += `(${escapePdfText(line)}) Tj\n`;
        } else {
          stream += `T* (${escapePdfText(line)}) Tj\n`;
        }
        currentY -= 15;
      });
      stream += `ET\n`;
      currentY -= 15; // gap between paragraphs
    });

    // Page footer
    stream += `BT\n/F1 9 Tf\n0.6 0.6 0.65 rg\n${margin} 35 Td\n(PDF Voice Reader Sample - Page ${pageObjectIds.length + 1}) Tj\nET\n`;

    const streamLength = stream.length;
    const contentStreamId = addObj(`<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`);
    const pageId = addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentStreamId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`
    );
    pageObjectIds.push(pageId);
  });

  // Put together objects
  let body = '%PDF-1.4\n%âãÏÓ\n';
  const offsets = [];

  function recordObj(id, content) {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${content}\nendobj\n`;
  }

  // 1: Catalog
  recordObj(catalogId, `<< /Type /Catalog /Pages 2 0 R >>`);
  // 2: Pages
  recordObj(pagesId, `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`);
  // 3: Font
  recordObj(fontId, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

  // Extra content & page objects
  for (let i = 3; i < objects.length; i++) {
    const obj = objects[i];
    recordObj(obj.id, obj.content);
  }

  // XREF table
  const startXref = body.length;
  body += `xref\n0 ${objCount + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objCount; i++) {
    const off = (offsets[i] || 0).toString().padStart(10, '0');
    body += `${off} 00000 n \n`;
  }

  body += `trailer\n<< /Size ${objCount + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return new Blob([body], { type: 'application/pdf' });
}

export const SAMPLE_DOCUMENTS = [
  {
    id: 'sample-cosmos',
    name: 'Wonders of the Cosmos (2 Pages)',
    description: 'An engaging astronomy article covering stars, nebulae, and galaxy exploration.',
    badge: 'Popular',
    getBlob: () =>
      createPdfBlob('Wonders of the Cosmos', [
        {
          title: 'Wonders of the Cosmos: Journey into Space',
          subtitle: 'A brief exploration of stellar nurseries, black holes, and the observable universe.',
          paragraphs: [
            {
              heading: '1. The Symphony of Starlight',
              body: 'Look up at the midnight sky and you are looking back in time. The light reaching your eyes from distant stars has traveled for thousands or even millions of years across the quiet depths of the cosmos. Every single star is a colossal nuclear engine fusing hydrogen into helium with extraordinary power and brilliance.'
            },
            {
              heading: '2. Nebulae and Stellar Nurseries',
              body: 'Spanning across hundreds of light-years, magnificent cosmic clouds of dust and ionized gas known as nebulae serve as the vibrant cradles for newborn planetary systems. Here, gravity pulls cold matter together over millennia until dense cores ignite into radiant suns.'
            },
            {
              heading: '3. The Mysterious Realm of Black Holes',
              body: 'At the extreme edges of astrophysics lie black holes, regions where gravitational forces are so intense that nothing, not even light itself, can escape their grasp. Supermassive black holes sit quietly at the center of nearly every major galaxy in the universe.'
            }
          ]
        },
        {
          title: 'Wonders of the Cosmos: Part II',
          subtitle: 'Planetary Systems and the Search for Extra-terrestrial Life',
          paragraphs: [
            {
              heading: '4. The Goldilocks Zone',
              body: 'Astronomers searching for life beyond Earth focus on the habitable zone around stars. In this temperate sweet spot, conditions are neither too scorching nor too freezing, allowing liquid water to pool sustainably on planetary surfaces.'
            },
            {
              heading: '5. The Vast Cosmic Horizon',
              body: 'The observable universe contains an estimated two trillion galaxies, each teeming with hundreds of billions of solar worlds. As our space telescopes peer deeper into the infrared cosmic dawn, humanity continues to unlock breathtaking secrets of our celestial origins.'
            }
          ]
        }
      ])
  },
  {
    id: 'sample-ai-speech',
    name: 'Voice Interfaces & Speech Synthesis',
    description: 'A technical overview of modern speech synthesis, text-to-speech synchronization, and interactive reading.',
    badge: 'Technical',
    getBlob: () =>
      createPdfBlob('Speech Synthesis & Voice Interfaces', [
        {
          title: 'Voice Interfaces & Interactive Speech Synthesis',
          subtitle: 'How synchronized word-level audio transforms modern digital reading accessibility.',
          paragraphs: [
            {
              heading: '1. The Evolution of Text-to-Speech',
              body: 'Text-to-speech technology has evolved from robotic, monotone synthesizer chips into natural, expressive voices capable of conveying rich human inflection, pacing, and emotional nuance across dozens of languages and dialects.'
            },
            {
              heading: '2. Real-Time Word Boundary Synchronization',
              body: 'Modern Web Speech APIs provide precise boundary event notifications as each word is vocalized. By mapping these character indices directly to document bounding coordinates, interactive applications can highlight words seamlessly in karaoke style.'
            },
            {
              heading: '3. Cognitive Benefits of Multimodal Reading',
              body: 'Studies demonstrate that combining auditory listening with synchronized visual text tracking significantly enhances comprehension, increases vocabulary retention, and dramatically reduces fatigue for students, professionals, and language learners worldwide.'
            }
          ]
        }
      ])
  }
];
