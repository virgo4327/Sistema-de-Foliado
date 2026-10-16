import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  convertMillimetersToTwip,
  BorderStyle,
  FrameAnchorType,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
} from 'docx';
import { saveAs } from 'file-saver';
import { numberToWords } from './numberToWords';

// Dimensiones de página en milímetros
const PAGE_SIZES = {
  A4:     { width: 210, height: 297 },
  Oficio: { width: 216, height: 330 },
};

/**
 * Genera y descarga un archivo .docx con un folio por página.
 * Cada folio aparece en la esquina superior derecha:
 *   - Número vertical (dígito por dígito), último dígito subrayado
 *   - Letras en vertical (carácter por carácter)
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

  // Márgenes de página (3mm en todos lados, igual que el diseño web)
  const marginTwip = convertMillimetersToTwip(3);

  // Ancho del frame del folio (~14mm para que quepa el texto)
  const frameWidth = convertMillimetersToTwip(14);

  // Construir todas las secciones del documento (una sección = una página)
  const sections = pages.map((num, idx) => {
    const formatted = num.toString().padStart(2, '0');
    const digits    = formatted.split('');

    const wordsRaw = numberToWords(num);
    const words    = wordsRaw.charAt(0).toUpperCase() + wordsRaw.slice(1).toLowerCase();
    const chars    = words.split('');

    const children = [];

    // Salto de página antes de cada folio (excepto el primero)
    if (idx > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
          spacing: { before: 0, after: 0 },
        })
      );
    }

    // --- Dígitos en vertical con frame posicionado en esquina superior derecha ---
    digits.forEach((digit, i) => {
      const isLast = i === digits.length - 1;

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0, line: 240 },
          border: isLast
            ? {
                bottom: {
                  color: '000000',
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              }
            : {},
          frame: {
            position: {
              x: { offset: pageWidthTwip - frameWidth - marginTwip, relative: HorizontalPositionRelativeFrom.PAGE },
              y: { offset: marginTwip, relative: VerticalPositionRelativeFrom.PAGE },
            },
            width: frameWidth,
            height: convertMillimetersToTwip(100),
            anchor: {
              horizontal: FrameAnchorType.PAGE,
              vertical: FrameAnchorType.PAGE,
            },
            allowOverlap: true,
          },
          children: [
            new TextRun({
              text: digit,
              font: 'Courier New',
              size: 18, // 9pt en half-points
            }),
          ],
        })
      );
    });

    // Espacio entre dígitos y letras
    children.push(
      new Paragraph({
        spacing: { before: 40, after: 0 },
        frame: {
          position: {
            x: { offset: pageWidthTwip - frameWidth - marginTwip, relative: HorizontalPositionRelativeFrom.PAGE },
            y: { offset: marginTwip, relative: VerticalPositionRelativeFrom.PAGE },
          },
          width: frameWidth,
          height: convertMillimetersToTwip(100),
          anchor: {
            horizontal: FrameAnchorType.PAGE,
            vertical: FrameAnchorType.PAGE,
          },
          allowOverlap: true,
        },
        children: [new TextRun({ text: '' })],
      })
    );

    // --- Letras en vertical ---
    chars.forEach((char) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0, line: 240 },
          frame: {
            position: {
              x: { offset: pageWidthTwip - frameWidth - marginTwip, relative: HorizontalPositionRelativeFrom.PAGE },
              y: { offset: marginTwip, relative: VerticalPositionRelativeFrom.PAGE },
            },
            width: frameWidth,
            height: convertMillimetersToTwip(100),
            anchor: {
              horizontal: FrameAnchorType.PAGE,
              vertical: FrameAnchorType.PAGE,
            },
            allowOverlap: true,
          },
          children: [
            new TextRun({
              text: char === ' ' ? '\u00A0' : char,
              font: 'Courier New',
              size: 18,
            }),
          ],
        })
      );
    });

    return children;
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
              top:    marginTwip,
              right:  marginTwip,
              bottom: marginTwip,
              left:   marginTwip,
            },
          },
        },
        children: sections.flat(),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `folios_${start}_${end}.docx`);
}
