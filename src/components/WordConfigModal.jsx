import React, { useEffect, useState, useRef } from 'react';
import styles from '../styles/WordConfigModal.module.css';
import { opcionesPorDefecto, validarOpciones } from '../utils/generateWordDoc';
import { numberToWordsWord } from '../utils/numberToWordsWord';

const MAX_FOLIOS = 50000;

export default function WordConfigModal({ open, onClose, start, end, pageSize, onGenerate, generating }) {
  const [startVal, setStartVal] = useState(start);
  const [endVal, setEndVal] = useState(end);
  const [orient, setOrient] = useState('horizontal');
  const [cfgs, setCfgs] = useState({ horizontal: opcionesPorDefecto('horizontal'), vertical: opcionesPorDefecto('vertical') });
  useEffect(() => { setStartVal(start); setEndVal(end); }, [start, end]);

  const cfg = cfgs[orient];
  const setField = (k, v) => setCfgs(prev => ({ ...prev, [orient]: { ...prev[orient], [k]: v } }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && !generating) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, generating, onClose]);

  if (!open) return null;

  const s = parseInt(startVal, 10), e = parseInt(endVal, 10);
  const total = Number.isFinite(s) && Number.isFinite(e) && e >= s ? e - s + 1 : 0;
  const o = { ...cfg, orient };
  const err = total > 0 ? validarOpciones(s, e, o) : null;
  const warn = (o.edgeMm < 5 || (o.pos !== 'center' && o.sideMm < 5)) ? 'Muchas impresoras no imprimen a menos de 5 mm del borde.' : (total > 20000 ? 'Rango grande: la generación puede tardar.' : null);

  const firstFolio = Number.isFinite(s) && s >= 1 ? s : 1;

  const handleGenerate = () => {
    if (err || total > MAX_FOLIOS || total === 0) return;
    onGenerate(o, s, e);
  };

  const OPT_EDGE = orient === 'horizontal' ? [['top','Superior'],['bottom','Inferior']] : [['left','Izquierdo'],['right','Derecho']];
  const OPT_POS = orient === 'horizontal' ? [['left','Izquierda'],['center','Centro'],['right','Derecha']] : [['top','Arriba'],['center','Centro'],['bottom','Abajo']];

  return (
    <div className={`${styles.overlay} no-print`} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Configurar descarga de Word</h2>
          <button className={styles.close} onClick={onClose} disabled={generating} aria-label="Cerrar">×</button>
        </div>
        <p className={styles.sub}>Papel: {pageSize} · Total: {total} folios</p>
        <div className={styles.layout}>
          <div className={styles.controls}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Folio inicial</label>
                <input type="number" min="1" value={startVal} onChange={ev=>setStartVal(ev.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Folio final</label>
                <input type="number" min="1" value={endVal} onChange={ev=>setEndVal(ev.target.value)} />
              </div>
            </div>
            <div className={styles.group}>
              <div className={styles.gtitle}>Orientación del texto</div>
              <div className={styles.seg}>
                <button className={orient==='horizontal'?styles.on:''} onClick={()=>setOrient('horizontal')}>Horizontal</button>
                <button className={orient==='vertical'?styles.on:''} onClick={()=>setOrient('vertical')}>Vertical</button>
              </div>
            </div>
            <div className={styles.panel}>
              <div className={styles.group}>
                <div className={styles.gtitle}>Borde de la hoja</div>
                <div className={styles.seg}>
                  {OPT_EDGE.map(([v,t])=>(
                    <button key={v} className={cfg.edge===v?styles.on:''} onClick={()=>setField('edge',v)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={styles.group}>
                <div className={styles.gtitle}>Posición en ese borde</div>
                <div className={styles.seg}>
                  {OPT_POS.map(([v,t])=>(
                    <button key={v} className={cfg.pos===v?styles.on:''} onClick={()=>setField('pos',v)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={styles.group}>
                <div className={styles.gtitle}>Qué va primero</div>
                <div className={styles.seg}>
                  <button className={cfg.order==='num'?styles.on:''} onClick={()=>setField('order','num')}>Número primero</button>
                  <button className={cfg.order==='let'?styles.on:''} onClick={()=>setField('order','let')}>Letras primero</button>
                </div>
              </div>
              <div className={styles.group}>
                <div className={styles.gtitle}>Formato</div>
                <div className={styles.seg}>
                  <button className={cfg.lines===2?styles.on:''} onClick={()=>setField('lines',2)}>Dos líneas</button>
                  <button className={cfg.lines===1?styles.on:''} onClick={()=>setField('lines',1)}>Una línea</button>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Número (pt)</label>
                  <input type="number" min="8" max="48" step="0.5" value={cfg.numPt} onChange={e=>setField('numPt',parseFloat(e.target.value))} />
                </div>
                <div className={styles.field}>
                  <label>Letras (pt)</label>
                  <input type="number" min="8" max="48" step="0.5" value={cfg.letPt} onChange={e=>setField('letPt',parseFloat(e.target.value))} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Distancia al borde {cfg.edge}</label>
                  <input type="number" min="2" max="100" step="1" value={cfg.edgeMm} onChange={e=>setField('edgeMm',parseFloat(e.target.value))} />
                </div>
                <div className={styles.field}>
                  <label>Distancia lateral</label>
                  <input type="number" min="2" max="100" step="1" value={cfg.sideMm} disabled={cfg.pos==='center'} onChange={e=>setField('sideMm',parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
            {err && <div className={`${styles.warn} ${styles.err}`}>{err}</div>}
            {!err && warn && <div className={styles.warn}>{warn}</div>}
            {total > MAX_FOLIOS && <div className={`${styles.warn} ${styles.err}`}>Máximo {MAX_FOLIOS} folios por archivo.</div>}
          </div>
          <div className={styles.preview}>
            <div ref={null} className={styles.page} style={{ width: (pageSize==='Oficio'?216:210)*1.5, height: (pageSize==='Oficio'?330:297)*1.5, position:'relative' }}>
              <WordPreview o={o} folio={firstFolio} pageSize={pageSize} />
            </div>
            <div className={styles.cap}>Vista previa del Word · {pageSize} · {total} páginas</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose} disabled={generating}>Cancelar</button>
          <button className={styles.gen} onClick={handleGenerate} disabled={generating || !!err || total===0 || total>MAX_FOLIOS}>
            {generating ? 'Generando Word...' : 'Generar y descargar Word'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WordPreview({ o, folio }) {
  const PT_MM = 25.4 / 72;
  const PX_MM = 1.5;
  const num = String(folio);
  const letras = numberToWordsWord(folio);
  const numPt = o.numPt || 16, letPt = o.letPt || 12;
  const px = (pt) => (pt * PT_MM * PX_MM) + 'px';
  const mm = (v) => (v * PX_MM) + 'px';
  const dos = (o.lines === 2);
  const P = { num: { t: num, pt: numPt, it: false }, let: { t: letras, pt: letPt, it: true } };
  const par = o.order === 'let' ? [P.let, P.num] : [P.num, P.let];
  const bloque = (p) => (
    <div style={{ fontSize: px(p.pt), fontStyle: p.it ? 'italic' : 'normal', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{p.t}</div>
  );
  const linea = (
    <>
      <span style={{ fontSize: px(par[0].pt), fontStyle: par[0].it ? 'italic' : 'normal', fontWeight: 700 }}>{par[0].t}</span>
      <span style={{ fontSize: px(letPt), fontWeight: 700 }}> – </span>
      <span style={{ fontSize: px(par[1].pt), fontStyle: par[1].it ? 'italic' : 'normal', fontWeight: 700 }}>{par[1].t}</span>
    </>
  );
  const inner = dos ? <>{bloque(par[0])}{bloque(par[1])}</> : linea;
  const style = { position: 'absolute', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'Cambria, Georgia, serif', color: '#111' };
  if (o.orient === 'vertical') {
    style.top = mm(o.pos === 'top' ? o.sideMm : 10);
    style.bottom = mm(o.pos === 'bottom' ? o.sideMm : 10);
    style.display = 'flex';
    style.flexDirection = 'column';
    style.justifyContent = o.pos === 'top' ? 'flex-start' : o.pos === 'bottom' ? 'flex-end' : 'center';
    if (o.edge === 'left') style.left = mm(o.edgeMm); else style.right = mm(o.edgeMm);
    return <div style={{ ...style, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{inner}</div>;
  }

  if (o.edge === 'top') style.top = mm(o.edgeMm); else style.bottom = mm(o.edgeMm);
  if (o.pos === 'left') { style.left = mm(o.sideMm); style.textAlign = 'left'; }
  else if (o.pos === 'right') { style.right = mm(o.sideMm); style.textAlign = 'right'; }
  else { style.left = '0'; style.right = '0'; style.textAlign = 'center'; }
  return <div style={style}>{inner}</div>;
}