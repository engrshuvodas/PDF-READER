/**
 * Validated High-Fidelity Sample PDF Generator
 * Generates standards-compliant PDF binary Blobs entirely client-side
 * for instant testing without needing to upload a local PDF file.
 */

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createPdfBlob(docTitle, pagesData) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;

  let nextId = 1;
  function createId() {
    return nextId++;
  }

  const catalogId = createId(); // 1
  const pagesParentId = createId(); // 2
  const fontId = createId(); // 3

  const pageIds = [];
  const pageEntries = [];

  for (const page of pagesData) {
    let stream = '';
    let currentY = pageHeight - margin - 20;

    if (page.title) {
      stream += `BT\n/F1 20 Tf\n0.12 0.2 0.4 rg\n${margin} ${currentY} Td\n(${escapePdfText(page.title)}) Tj\nET\n`;
      currentY -= 32;
    }

    if (page.subtitle) {
      stream += `BT\n/F1 12 Tf\n0.35 0.4 0.5 rg\n${margin} ${currentY} Td\n(${escapePdfText(page.subtitle)}) Tj\nET\n`;
      currentY -= 25;
    }

    // Horizontal Divider
    stream += `0.85 0.88 0.92 RG 1.5 w\n${margin} ${currentY + 10} m ${pageWidth - margin} ${currentY + 10} l S\n`;
    currentY -= 15;

    for (const p of page.paragraphs) {
      if (p.heading) {
        currentY -= 10;
        stream += `BT\n/F1 14 Tf\n0.18 0.22 0.32 rg\n${margin} ${currentY} Td\n(${escapePdfText(p.heading)}) Tj\nET\n`;
        currentY -= 20;
      }

      const words = p.body.split(/\s+/);
      const lines = [];
      let currentLine = '';
      for (const w of words) {
        if ((currentLine + ' ' + w).trim().length > 68) {
          lines.push(currentLine.trim());
          currentLine = w + ' ';
        } else {
          currentLine += w + ' ';
        }
      }
      if (currentLine.trim()) lines.push(currentLine.trim());

      stream += `BT\n/F1 11 Tf\n0.15 0.15 0.18 rg\n${margin} ${currentY} Td\n16 TL\n`;
      lines.forEach((line, idx) => {
        if (idx === 0) {
          stream += `(${escapePdfText(line)}) Tj\n`;
        } else {
          stream += `T* (${escapePdfText(line)}) Tj\n`;
        }
        currentY -= 16;
      });
      stream += `ET\n`;
      currentY -= 14;
    }

    // Page footer
    stream += `BT\n/F1 9 Tf\n0.5 0.5 0.55 rg\n${margin} 35 Td\n(PDF Voice Reader Sample - Page ${pageIds.length + 1}) Tj\nET\n`;

    const contentId = createId();
    const pageId = createId();
    pageIds.push(pageId);

    const streamBytesLen = new TextEncoder().encode(stream).length;
    const contentObj = `${contentId} 0 obj\n<< /Length ${streamBytesLen} >>\nstream\n${stream}\nendstream\nendobj\n`;
    const pageObj = `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesParentId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`;

    pageEntries.push({ contentId, contentObj, pageId, pageObj });
  }

  // Build Object map
  const objMap = new Map();
  objMap.set(catalogId, `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesParentId} 0 R >>\nendobj\n`);
  objMap.set(pagesParentId, `${pagesParentId} 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>\nendobj\n`);
  objMap.set(fontId, `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  for (const entry of pageEntries) {
    objMap.set(entry.contentId, entry.contentObj);
    objMap.set(entry.pageId, entry.pageObj);
  }

  let pdfString = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];

  for (let id = 1; id < nextId; id++) {
    offsets[id] = new TextEncoder().encode(pdfString).length;
    pdfString += objMap.get(id);
  }

  const startXref = new TextEncoder().encode(pdfString).length;
  pdfString += `xref\n0 ${nextId}\n0000000000 65535 f \r\n`;
  for (let id = 1; id < nextId; id++) {
    const off = (offsets[id] || 0).toString().padStart(10, '0');
    pdfString += `${off} 00000 n \r\n`;
  }

  pdfString += `trailer\n<< /Size ${nextId} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const uint8 = new Uint8Array(new TextEncoder().encode(pdfString));
  return new Blob([uint8], { type: 'application/pdf' });
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
