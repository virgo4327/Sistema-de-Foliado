import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  convertMillimetersToTwip,
  FrameAnchorType,
} from 'docx';
import { saveAs } from 'file-saver';
import { numberToWords } from './numberToWords';

// Dimensiones de página en milímetros
const PAGE_SIZES = {
  A4:     { width: 210, height: 297 },
  Oficio: { width: 216, height: 330 },
};

/**
 * Construye los párrafos de un folio individual.
 * Diseño: número vertical (dígito por dígito) + línea bajo último dígito + letras vertical.
 */
function buildFolioContent(num) {
  const formatted = num.toString().padStart(2, '0');
  const digits = formatted.split('');

  const wordsRaw = numberToWords(num);
  const words = wordsRaw.charAt(0).toUpperCase() + wordsRaw.slice(1).toLowerCase();
  const chars = words.split('');

  const paragraphs = [];

  // --- Dígitos en vertical ---
  digits.forEach((digit, i) => {
    const isLast = i === digits.length - 1;
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240 },
        border: isLast
          ? { bottom: { color: '000000', space: 1, style: 'single', size: 6 } }
          : {},
        children: [
          new TextRun({
            text: digit,
            font: 'Courier New',
            size: 20,
          }),
        ],
      })
    );
  });

  // Separación entre número y letras
  paragraphs.push(
    new Paragraph({
      spacing: { before: 40, after: 0 },
      children: [new TextRun({ text: '' })],
    })
  );

  // --- Letras en vertical ---
  chars.forEach((char) => {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({
            text: char === ' ' ? '\u00A0' : char,
            font: 'Courier New',
            size: 20,
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
 * @param {number[]} pages    - Array de números de folio
 * @param {string}  pageSize  - 'A4' | 'Oficio'
 * @param {number}  start     - Número inicial (para el nombre del archivo)
 * @param {number}  end       - Número final (para el nombre del archivo)
 */
export async function generateAndDownloadWord(pages, pageSize, start, end) {
  const size = PAGE_SIZES[pageSize] ?? PAGE_SIZES['A4'];

  const pageWidth  = convertMillimetersToTwip(size.width);
  const pageHeight = convertMillimetersToTwip(size.height);

  // Ancho del frame del folio (~15mm)
  const frameWidth = convertMillimetersToTwip(15);
  // Posición X: 3mm desde el borde derecho
  const frameX = pageWidth - frameWidth - convertMillimetersToTwip(3);
  // Posición Y: 3mm desde arriba
  const frameY = convertMillimetersToTwip(3);

  // Construir todos los hijos de la sección única
  const allChildren = [];

  pages.forEach((num, idx) => {
    const folioParagraphs = buildFolioContent(num);

    // Salto de página entre folios (no antes del primero)
    if (idx > 0) {
      allChildren.push(
        new Paragraph({
          children: [new PageBreak()],
          spacing: { before: 0, after: 0 },
        })
      );
    }

    // Aplicar frame posicionado a cada párrafo del folio
    folioParagraphs.forEach((p) => {
      p.addFrameProperty({
        width: frameWidth,
        height: convertMillimetersToTwip(80),
        anchor: {
          horizontal: FrameAnchorType.PAGE,
          vertical: FrameAnchorType.PAGE,
        },
        position: {
          x: frameX,
          y: frameY,
        },
        wrap: 'notBeside',
      });
      allChildren.push(p);
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidth,
              height: pageHeight,
            },
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
        },
        children: allChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `folios_${start}_${end}.docx`);
}
