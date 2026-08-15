import * as pdfjsLib from 'pdfjs-dist';

function encodePdfString(text) {
  // Check if string contains non-ASCII/Unicode characters (like Bengali)
  const isUnicode = /[^\x20-\x7E]/.test(text);
  if (!isUnicode) {
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    return `(${escaped})`;
  }

  // Encode as Hexadecimal UTF-16BE: <FEFF....>
  let hex = 'FEFF';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    hex += code.toString(16).padStart(4, '0').toUpperCase();
  }
  return `<${hex}>`;
}

function createSampleUnicodePdf() {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;

  const catalogId = 1;
  const pagesParentId = 2;
  const fontId = 3;
  const contentId = 4;
  const pageId = 5;

  let stream = '';
  let currentY = pageHeight - margin - 20;

  const title = "Welcome & স্বাগতম - Bilingual PDF";
  stream += `BT\n/F1 18 Tf\n0.12 0.2 0.4 rg\n${margin} ${currentY} Td\n${encodePdfString(title)} Tj\nET\n`;
  currentY -= 35;

  const p1 = "This is an English paragraph demonstrating automatic language switching.";
  stream += `BT\n/F1 12 Tf\n0.15 0.15 0.18 rg\n${margin} ${currentY} Td\n${encodePdfString(p1)} Tj\nET\n`;
  currentY -= 30;

  const p2 = "এটি একটি বাংলা প্যারাগ্রাফ। এখানে স্বয়ংক্রিয়ভাবে বাংলা কণ্ঠস্বর ব্যবহার করা হবে।";
  stream += `BT\n/F1 12 Tf\n0.15 0.15 0.18 rg\n${margin} ${currentY} Td\n${encodePdfString(p2)} Tj\nET\n`;
  currentY -= 30;

  const p3 = "PDF Voice Reader supports both English and বাংলা (Bangla) text seamlessly.";
  stream += `BT\n/F1 12 Tf\n0.15 0.15 0.18 rg\n${margin} ${currentY} Td\n${encodePdfString(p3)} Tj\nET\n`;

  const streamBytes = Buffer.from(stream, 'latin1');

  const objMap = new Map();
  objMap.set(catalogId, `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesParentId} 0 R >>\nendobj\n`);
  objMap.set(pagesParentId, `${pagesParentId} 0 obj\n<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>\nendobj\n`);
  objMap.set(fontId, `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  objMap.set(contentId, `${contentId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  objMap.set(pageId, `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesParentId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj\n`);

  let pdfString = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];

  for (let id = 1; id <= 5; id++) {
    offsets[id] = Buffer.byteLength(pdfString, 'binary');
    pdfString += objMap.get(id);
  }

  const startXref = Buffer.byteLength(pdfString, 'binary');
  pdfString += `xref\n0 6\n0000000000 65535 f \r\n`;
  for (let id = 1; id <= 5; id++) {
    const off = (offsets[id] || 0).toString().padStart(10, '0');
    pdfString += `${off} 00000 n \r\n`;
  }

  pdfString += `trailer\n<< /Size 6 /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdfString, 'binary');
}

async function run() {
  const pdfBytes = createSampleUnicodePdf();
  const getDoc = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
  const doc = await getDoc({ data: new Uint8Array(pdfBytes) }).promise;
  const page = await doc.getPage(1);
  const textContent = await page.getTextContent();
  console.log('Extracted items count:', textContent.items.length);
  for (const it of textContent.items) {
    console.log('Item:', it.str);
  }
}

run().catch(console.error);
