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

// Borde completamente invisible
const NO_BORDER = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

// Sin padding de celda (0 en todos los lados)
const NO_CELL_MARGIN = {
  top:    { value: 0, type: WidthType.DXA },
  bottom: { value: 0, type: WidthType.DXA },
  left:   { value: 0, type: WidthType.DXA },
  right:  { value: 0, type: WidthType.DXA },
};

/**
 * Construye los párrafos del folio:
 *   - Dígitos verticales, último con subrayado fino
 *   - Letras del número en español, verticales
 *   Todo compacto, sin espacio entre número y letras
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
        spacing: { before: 0, after: 0, line: 140, lineRule: 'exact' },
        border: isLast
          ? { bottom: { color: '000000', space: 0, style: BorderStyle.SINGLE, size: 1 } } // línea fina
          : {},
        children: [
          new TextRun({
            text: digit,
            font: 'Courier New',
            size: 14, // 7pt — compacto
          }),
        ],
      })
    );
  });

  // Letras en vertical — pegadas al número, sin espacio
  chars.forEach((char) => {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 140, lineRule: 'exact' },
        children: [
          new TextRun({
            text: char === ' ' ? '\u00A0' : char,
            font: 'Courier New',
            size: 14,
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
 * Diseño: tabla invisible de 2 columnas [celda vacía ancha | folio estrecho]
 * Márgenes de página: 0 en todos los lados para que el folio quede
 * exactamente en la esquina superior derecha del papel.
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

  // Márgenes de página = 0 para que el sello quede pegado al borde
  const pageMargin = 0;

  // Ancho total de la tabla = ancho de página completo
  const tableWidth = pageWidthTwip;

  // Columna del folio: ~12mm (suficiente para 2 dígitos + letras cortas)
  const folioColWidth = convertMillimetersToTwip(12);
  const emptyColWidth = tableWidth - folioColWidth;

  const allChildren = [];

  pages.forEach((num, idx) => {
    if (idx > 0) {
      allChildren.push(
        new Paragraph({
          children: [new PageBreak()],
          spacing: { before: 0, after: 0 },
        })
      );
    }

    const folioParagraphs = buildFolioParagraphs(num);

    const table = new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      borders: {
        top:     { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom:  { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left:    { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideH: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideV: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      },
      rows: [
        new TableRow({
          children: [
            // Celda izquierda: vacía, ocupa el resto del ancho
            new TableCell({
              width: { size: emptyColWidth, type: WidthType.DXA },
              borders: NO_BORDER,
              margins: NO_CELL_MARGIN,
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun('')],
                }),
              ],
            }),
            // Celda derecha: sello del folio, sin padding
            new TableCell({
              width: { size: folioColWidth, type: WidthType.DXA },
              borders: NO_BORDER,
              margins: NO_CELL_MARGIN,
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
              top:    pageMargin,
              right:  pageMargin,
              bottom: pageMargin,
              left:   pageMargin,
            },
            gutter: 0,
          },
        },
        children: allChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `folios_${start}_${end}.docx`);
}
