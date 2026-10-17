import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  convertMillimetersToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { numberToWords } from './numberToWords.js';

// Dimensiones de página en milímetros
const PAGE_SIZES = {
  A4:     { width: 210, height: 297 },
  Oficio: { width: 216, height: 330 },
};

/**
 * Construye los párrafos del folio alineados a la derecha:
 *   - Dígitos verticales, último con subrayado fino (idéntico a la vista previa)
 *   - Letras del número en español, verticales
 *   - Sin tablas ni marcos, para que quede limpio y flotante como un sello
 *
 * @param {number|string} num        - Número de folio
 * @param {boolean}       isNewPage  - Si debe iniciar con salto de página
 */
function buildFolioParagraphs(num, isNewPage = false) {
  const numericVal = typeof num === 'string' ? parseInt(num, 10) || 0 : Number(num);
  const formatted = numericVal.toString().padStart(2, '0');
  const digits    = formatted.split('');

  const wordsRaw = numberToWords(numericVal) || '';
  const words    = wordsRaw ? wordsRaw.charAt(0).toUpperCase() + wordsRaw.slice(1).toLowerCase() : '';
  const chars    = words.split('');

  const paragraphs = [];

  // Dígitos en vertical
  digits.forEach((digit, i) => {
    const isFirst = i === 0;
    const isLast  = i === digits.length - 1;
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        pageBreakBefore: isFirst && isNewPage,
        spacing: {
          before: 0,
          after: isLast ? 60 : 0, // 3pt de respiro tras el último dígito
          line: 210,              // 10.5pt exacto (igual a la vista previa)
          lineRule: 'exact',
        },
        children: [
          new TextRun({
            text: digit,
            font: 'Courier New',
            size: 20, // 10pt
            underline: isLast ? { type: UnderlineType.SINGLE, color: '000000' } : undefined,
          }),
        ],
      })
    );
  });

  // Letras en vertical
  chars.forEach((char) => {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: {
          before: 0,
          after: 0,
          line: 210, // 10.5pt exacto
          lineRule: 'exact',
        },
        children: [
          new TextRun({
            text: char === ' ' ? '\u00A0' : char,
            font: 'Courier New',
            size: 20, // 10pt
          }),
        ],
      })
    );
  });

  return paragraphs;
}

/**
 * Genera y descarga un archivo .docx con un folio por página.
 *
 * Posicionamiento limpio mediante márgenes de 3mm (igual a la vista previa web)
 * y párrafos alineados a la derecha, sin tablas para evitar bordes o cuadrículas.
 *
 * @param {number[]} pages    - Array de números de folio
 * @param {string}  pageSize  - 'A4' | 'Oficio'
 * @param {number}  start     - Número inicial (nombre del archivo)
 * @param {number}  end       - Número final (nombre del archivo)
 */
export async function generateAndDownloadWord(pages, pageSize, start, end) {
  const size = PAGE_SIZES[pageSize] ?? PAGE_SIZES['A4'];

  const pageWidthTwip  = convertMillimetersToTwip(size.width);
  const pageHeightTwip = convertMillimetersToTwip(size.height);

  // Márgenes: 3mm en todos los lados (idéntico a top: 3mm, right: 3mm de la web)
  const margin3mm = convertMillimetersToTwip(3);

  if (!pages || pages.length === 0) {
    throw new Error('No hay páginas para generar');
  }

  const allChildren = [];

  pages.forEach((num, idx) => {
    const folioParagraphs = buildFolioParagraphs(num, idx > 0);
    allChildren.push(...folioParagraphs);
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width:  pageWidthTwip,
              height: pageHeightTwip,
            },
            margin: {
              top:    margin3mm,
              right:  margin3mm,
              bottom: margin3mm,
              left:   margin3mm,
              header: 0,
              footer: 0,
            },
          },
        },
        children: allChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `folios_${start}_${end}.docx`;
  
  if (typeof saveAs === 'function') {
    saveAs(blob, fileName);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
