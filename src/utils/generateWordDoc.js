import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  convertMillimetersToTwip,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import { numberToWords } from './numberToWords';

// Dimensiones de página en milímetros
const PAGE_SIZES = {
  A4:     { width: 210, height: 297 },
  Oficio: { width: 216, height: 330 },
};

// Borde invisible para celdas de la tabla
const NO_BORDER = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

/**
 * Construye los párrafos del folio:
 *   - Dígitos verticales, último con subrayado
 *   - Letras del número en español, verticales
 */
function buildFolioParagraphs(num) {
  const formatted = num.toString().padStart(2, '0');
  const digits    = formatted.split('');

  const wordsRaw = numberToWords(num);
  const words    = wordsRaw.charAt(0).toUpperCase() + wordsRaw.slice(1).toLowerCase();
  const chars    = words.split('');

  const paragraphs = [];

  // Dígitos en vertical
  digits.forEach((digit, i) => {
    const isLast = i === digits.length - 1;
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 220 },
        border: isLast
          ? { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } }
          : {},
        children: [
          new TextRun({
            text: digit,
            font: 'Courier New',
            size: 18, // 9pt
          }),
        ],
      })
    );
  });

  // Pequeño espacio
  paragraphs.push(
    new Paragraph({
      spacing: { before: 30, after: 0 },
      children: [new TextRun({ text: '' })],
    })
  );

  // Letras en vertical
  chars.forEach((char) => {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 220 },
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

  return paragraphs;
}

/**
 * Genera y descarga un archivo .docx con un folio por página.
 * El sello del folio aparece en la esquina superior derecha usando una tabla:
 *   | celda vacía ancha | celda con folio estrecha |
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
  const marginTwip     = convertMillimetersToTwip(5);

  // Ancho útil de la página descontando márgenes
  const usableWidth = pageWidthTwip - marginTwip * 2;

  // La columna del folio ocupa ~14mm, el resto es la columna vacía
  const folioColWidth = convertMillimetersToTwip(14);
  const emptyColWidth = usableWidth - folioColWidth;

  const allChildren = [];

  pages.forEach((num, idx) => {
    // Salto de página entre folios (no antes del primero)
    if (idx > 0) {
      allChildren.push(
        new Paragraph({
          children: [new PageBreak()],
          spacing: { before: 0, after: 0 },
        })
      );
    }

    const folioParagraphs = buildFolioParagraphs(num);

    // Tabla de 1 fila, 2 columnas: [vacío | folio]
    const table = new Table({
      width: { size: usableWidth, type: WidthType.DXA },
      borders: {
        top:           { style: BorderStyle.NONE, size: 0 },
        bottom:        { style: BorderStyle.NONE, size: 0 },
        left:          { style: BorderStyle.NONE, size: 0 },
        right:         { style: BorderStyle.NONE, size: 0 },
        insideH:       { style: BorderStyle.NONE, size: 0 },
        insideV:       { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        new TableRow({
          children: [
            // Celda izquierda vacía
            new TableCell({
              width: { size: emptyColWidth, type: WidthType.DXA },
              borders: NO_BORDER,
              verticalAlign: VerticalAlign.TOP,
              children: [new Paragraph({ children: [new TextRun('')] })],
            }),
            // Celda derecha con el folio
            new TableCell({
              width: { size: folioColWidth, type: WidthType.DXA },
              borders: NO_BORDER,
              verticalAlign: VerticalAlign.TOP,
              children: folioParagraphs,
            }),
          ],
        }),
      ],
    });

    allChildren.push(table);
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
        children: allChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `folios_${start}_${end}.docx`);
}
