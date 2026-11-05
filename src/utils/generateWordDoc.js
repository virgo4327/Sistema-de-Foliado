import JSZip from 'jszip';
import { numberToWordsWord } from './numberToWordsWord';
import { saveAs } from 'file-saver';

const PAGE_W = 11906, PAGE_H = 16838;
const mmToTw = mm => Math.round(mm * 56.6929);
const lineTw = pt => Math.ceil(pt * 20 * 1.2);
const EM_POR_CARACTER = 0.5;
const EM_POR_DIGITO = 0.6;
const MARGEN_OPUESTO_MM = 10;
const HOLGURA_TW = 20;
const SEP_TW = 20;
const COLA_TW = 40;

const OPC_HORIZONTAL = {orient:"horizontal", edge:"top", pos:"right", lines:2, order:"num", numPt:16, letPt:12, edgeMm:10, sideMm:15};
const OPC_VERTICAL = {orient:"vertical", edge:"right", pos:"top", lines:1, order:"num", numPt:16, letPt:12, edgeMm:6, sideMm:8};
export function opcionesPorDefecto(orient){ return Object.assign({}, orient === "vertical" ? OPC_VERTICAL : OPC_HORIZONTAL); }

function geometria(o){
  const opp = mmToTw(MARGEN_OPUESTO_MM), edge = mmToTw(o.edgeMm), side = mmToTw(o.sideMm);
  let left, right;
  if(o.pos === "left"){ left = side; right = opp; }
  else if(o.pos === "right"){ left = opp; right = side; }
  else { left = opp; right = opp; }
  const numH = lineTw(o.numPt), letH = lineTw(o.letPt), oneH = lineTw(Math.max(o.numPt, o.letPt));
  const blockH = o.lines === 2 ? numH + letH : oneH;
  let top, bottom;
  if(o.edge === "top"){ top = edge; bottom = mmToTw(20); }
  else { bottom = edge; top = PAGE_H - edge - blockH - HOLGURA_TW; }
  return {jc:o.pos, left, right, top, bottom, numH, letH, oneH, blockH};
}
function geometriaV(o){
  const opp = mmToTw(MARGEN_OPUESTO_MM), edge = mmToTw(o.edgeMm), along = mmToTw(o.sideMm);
  const left = o.edge === "left" ? edge : opp;
  const right = o.edge === "right" ? edge : opp;
  const Mt = o.pos === "top" ? along : opp;
  const Mb = o.pos === "bottom" ? along : opp;
  const numH = lineTw(o.numPt), letH = lineTw(o.letPt), oneH = lineTw(Math.max(o.numPt, o.letPt));
  const thick = o.lines === 2 ? numH + letH : oneH;
  return {
    left, right, top: Mt - SEP_TW, bottom: Mb - COLA_TW,
    rowH: PAGE_H - Mt - Mb, thick, numH, letH, oneH,
    jcTbl: o.edge === "left" ? "left" : "right",
    jcAlong: {top:"right", center:"center", bottom:"left"}[o.pos]
  };
}
const _cacheLargo = {};
function letrasMasLargas(start, end){
  const k = start + "-" + end;
  if(_cacheLargo[k] !== undefined) return _cacheLargo[k];
  let mx = 0;
  for(let n = start; n <= end; n++){ const l = numberToWordsWord(n).length; if(l > mx) mx = l; }
  return (_cacheLargo[k] = mx);
}
export function validarOpciones(start, end, o){
  const vert = (o.orient === "vertical");
  const bad = v => !Number.isFinite(v);
  if(bad(o.numPt) || o.numPt < 8 || o.numPt > 48) return "El tamaño del número debe estar entre 8 y 48 pt.";
  if(bad(o.letPt) || o.letPt < 8 || o.letPt > 48) return "El tamaño de las letras debe estar entre 8 y 48 pt.";
  const nomBorde = {top:"superior", bottom:"inferior", left:"izquierdo", right:"derecho"}[o.edge];
  if(bad(o.edgeMm) || o.edgeMm < 2 || o.edgeMm > 100) return "La distancia al borde " + nomBorde + " debe estar entre 2 y 100 mm.";
  if(o.pos !== "center" && (bad(o.sideMm) || o.sideMm < 2 || o.sideMm > 100)) return "La segunda distancia al borde debe estar entre 2 y 100 mm.";
  const g = vert ? geometriaV(o) : geometria(o);
  if(g.top < 0 || g.bottom < 0) return "Esas medidas no caben en la hoja.";
  let disponible, medida;
  if(vert){
    const grosorLibre = (PAGE_W - g.left - g.right);
    if(grosorLibre < g.thick) return "Esas medidas no caben en el ancho de la hoja.";
    disponible = g.rowH / 20; medida = "alto";
  } else {
    disponible = (PAGE_W - g.left - g.right) / 20; medida = "ancho";
  }
  const wNum = String(end).length * EM_POR_DIGITO * o.numPt;
  const wLet = letrasMasLargas(start, end) * EM_POR_CARACTER * o.letPt;
  const wSep = 3 * EM_POR_CARACTER * o.letPt;
  if(o.lines === 2){
    if(wLet > disponible) return "Las letras más largas de tu rango no caben en el " + medida + " de la hoja con ese tamaño. Usa " + Math.floor(o.letPt * disponible / wLet) + " pt o menos.";
    if(wNum > disponible) return "El número no cabe en el " + medida + " de la hoja con ese tamaño. Usa " + Math.floor(o.numPt * disponible / wNum) + " pt o menos.";
  } else {
    const necesario = wNum + wSep + wLet;
    if(necesario > disponible){
      const f = disponible / necesario;
      return "En una sola línea, el folio más largo de tu rango no cabe en el " + medida + " de la hoja. Reduce los tamaños (letras a " + Math.floor(o.letPt * f) + " pt y número a " + Math.floor(o.numPt * f) + " pt, aprox.) o usa dos líneas.";
    }
  }
  return null;
}

const DOC_HEAD = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" mc:Ignorable="w14 wp14 w15"><w:background w:color="FFFFFF"/><w:body>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/_rels/.rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/word/_rels/document.xml.rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

const RELS_ROOT = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officedocument/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Application>Foliador</Application><AppVersion>15.0000</AppVersion></Properties>`;

const CORE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><cp:revision>1</cp:revision></cp:coreProperties>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

const FONT_TABLE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:font w:name="Cambria"><w:charset w:val="00" w:characterSet="windows-1252"/><w:family w:val="roman"/><w:pitch w:val="variable"/></w:font></w:fonts>`;

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="709"/><w:autoHyphenation w:val="true"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="11"/></w:compat></w:settings>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:widowControl w:val="false"/></w:pPr><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style></w:styles>`;

const THEME_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" name="Office"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="ffffff"/></a:lt1><a:dk2><a:srgbClr val="000000"/></a:dk2><a:lt2><a:srgbClr val="ffffff"/></a:lt2><a:accent1><a:srgbClr val="18a303"/></a:accent1><a:accent2><a:srgbClr val="0369a3"/></a:accent2><a:accent3><a:srgbClr val="a33e03"/></a:accent3><a:accent4><a:srgbClr val="8e03a3"/></a:accent4><a:accent5><a:srgbClr val="c99c00"/></a:accent5><a:accent6><a:srgbClr val="c9211e"/></a:accent6><a:hlink><a:srgbClr val="0000ee"/></a:hlink><a:folHlink><a:srgbClr val="551a8b"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Cambria"/></a:majorFont><a:minorFont><a:latin typeface="Cambria"/></a:minorFont></a:fontScheme><a:fmtScheme><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;

function runH(text, pt, bold, italic){
  const hp = Math.round(pt * 2);
  return '<w:r><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:cs="Cambria"/>' +
    (bold ? '<w:b/><w:bCs/>' : '') + (italic ? '<w:i/><w:iCs/>' : '') +
    '<w:sz w:val="' + hp + '"/><w:szCs w:val="' + hp + '"/><w:lang w:val="es-PE"/></w:rPr>' +
    '<w:t xml:space="preserve">' + text + '</w:t></w:r>';
}
function partesFolio(n, letras, o){
  const N = {t:String(n), pt:o.numPt, it:false}, L = {t:letras, pt:o.letPt, it:true};
  return o.order === "let" ? [L, N] : [N, L];
}
const runParte = p => runH(p.t, p.pt, true, p.it);
function paraH(runs, lineTwips, jc, breakBefore){
  return '<w:p><w:pPr><w:pStyle w:val="Normal"/>' + (breakBefore ? '<w:pageBreakBefore/>' : '') +
    '<w:spacing w:before="0" w:after="0" w:line="' + lineTwips + '" w:lineRule="exact"/>' +
    '<w:ind w:left="0" w:right="0"/><w:jc w:val="' + jc + '"/></w:pPr>' + runs + '</w:p>';
}
function buildSectPrH(g){
  return '<w:sectPr><w:type w:val="nextPage"/><w:pgSz w:w="' + PAGE_W + '" w:h="' + PAGE_H + '"/>' +
    '<w:pgMar w:top="' + g.top + '" w:right="' + g.right + '" w:bottom="' + g.bottom + '" w:left="' + g.left +
    '" w:header="0" w:footer="0" w:gutter="0"/><w:docGrid w:type="default" w:linePitch="360"/></w:sectPr>';
}
function buildDocumentXmlH(start, end, o){
  const g = geometria(o);
  const parts = [];
  for(let n = start; n <= end; n++){
    const first = (n === start);
    const pr = partesFolio(n, numberToWordsWord(n), o);
    if(o.lines === 2){
      parts.push(paraH(runParte(pr[0]), lineTw(pr[0].pt), g.jc, !first));
      parts.push(paraH(runParte(pr[1]), lineTw(pr[1].pt), g.jc, false));
    } else {
      parts.push(paraH(runParte(pr[0]) + runH(" \u2013 ", o.letPt, true, false) + runParte(pr[1]), g.oneH, g.jc, !first));
    }
  }
  return DOC_HEAD + parts.join("") + buildSectPrH(g) + "</w:body></w:document>";
}
function sepP(breakBefore){
  return '<w:p><w:pPr><w:pStyle w:val="Normal"/>' + (breakBefore ? '<w:pageBreakBefore/>' : '') +
    '<w:spacing w:before="0" w:after="0" w:line="' + SEP_TW + '" w:lineRule="exact"/>' +
    '<w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr></w:pPr></w:p>';
}
function tablaV(paras, g){
  return '<w:tbl><w:tblPr><w:tblW w:w="' + g.thick + '" w:type="dxa"/><w:jc w:val="' + g.jcTbl + '"/>' +
    '<w:tblInd w:w="0" w:type="dxa"/><w:tblLayout w:type="fixed"/>' +
    '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
    '<w:tblGrid><w:gridCol w:w="' + g.thick + '"/></w:tblGrid>' +
    '<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="' + g.rowH + '" w:hRule="exact"/></w:trPr>' +
    '<w:tc><w:tcPr><w:tcW w:w="' + g.thick + '" w:type="dxa"/><w:textDirection w:val="btLr"/></w:tcPr>' + paras + '</w:tc></w:tr></w:tbl>';
}
function buildDocumentXmlV(start, end, o){
  const g = geometriaV(o);
  const parts = [];
  for(let n = start; n <= end; n++){
    const pr = partesFolio(n, numberToWordsWord(n), o);
    parts.push(sepP(n !== start));
    let paras;
    if(o.lines === 2){
      paras = paraH(runParte(pr[0]), lineTw(pr[0].pt), g.jcAlong, false) +
              paraH(runParte(pr[1]), lineTw(pr[1].pt), g.jcAlong, false);
    } else {
      paras = paraH(runParte(pr[0]) + runH(" \u2013 ", o.letPt, true, false) + runParte(pr[1]), g.oneH, g.jcAlong, false);
    }
    parts.push(tablaV(paras, g));
  }
  parts.push(sepP(false));
  return DOC_HEAD + parts.join("") + buildSectPrH(g) + "</w:body></w:document>";
}

export async function generateAndDownloadWord(pages, pageSize, start, end, wordCfg){
  const o = Object.assign(opcionesPorDefecto(wordCfg.orient || "horizontal"), wordCfg);
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS_ROOT);
  zip.file("docProps/app.xml", APP_XML);
  zip.file("docProps/core.xml", CORE_XML);
  zip.file("word/_rels/document.xml.rels", DOC_RELS);
  zip.file("word/fontTable.xml", FONT_TABLE);
  zip.file("word/settings.xml", SETTINGS_XML);
  zip.file("word/styles.xml", STYLES_XML);
  zip.file("word/theme/theme1.xml", THEME_XML);
  zip.file("word/document.xml", o.orient === "vertical" ? buildDocumentXmlV(start, end, o) : buildDocumentXmlH(start, end, o));
  const blob = await zip.generateAsync({type:"blob", compression:"DEFLATE", compressionOptions:{level:6}, mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  const E = {top:"sup", bottom:"inf", left:"izq", right:"der"};
  const P = {left:"izq", center:"cen", right:"der", top:"arr", bottom:"aba"};
  const base = "Foliador_" + String(start).padStart(3, "0") + "-" + String(end).padStart(3, "0");
  const name = base + (o.orient === "vertical" ? "_vert-" : "_horiz-") + E[o.edge] + "-" + P[o.pos] + (o.lines === 1 ? "_1linea" : "") + (o.order === "let" ? "_letras-primero" : "") + ".docx";
  saveAs(blob, name);
}