import React from 'react';
import styles from '../styles/ConfigPanel.module.css';

const ConfigPanel = ({ 
  startNumber, 
  setStartNumber, 
  endNumber, 
  setEndNumber, 
  pageSize, 
  setPageSize, 
  printOrder,
  setPrintOrder,
  onGenerate, 
  onPrint, 
  onClear,
  isGenerated 
}) => {
  return (
    <div className={`${styles.configPanel} no-print`}>
      <div className={styles.header}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <h1>Sistema de Foliado</h1>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Inicio</label>
          <input 
            type="number" 
            className={styles.inputField}
            placeholder="Ingresar número"
            value={startNumber === 0 ? '' : startNumber}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || val === '-') {
                setStartNumber(val);
              } else {
                const num = parseInt(val, 10);
                if (!isNaN(num)) setStartNumber(num);
              }
            }}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Final</label>
          <input 
            type="number" 
            className={styles.inputField}
            placeholder="Ingresar número"
            value={endNumber === 0 ? '' : endNumber}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || val === '-') {
                setEndNumber(val);
              } else {
                const num = parseInt(val, 10);
                if (!isNaN(num)) setEndNumber(num);
              }
            }}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Tamaño</label>
          <select 
            className={styles.inputField}
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
          >
            <option value="A4">A4</option>
            <option value="Oficio">Oficio</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Orden</label>
          <select 
            className={styles.inputField}
            value={printOrder}
            onChange={(e) => setPrintOrder(e.target.value)}
          >
            <option value="asc">Ascendente (Normal)</option>
            <option value="desc">Descendente (Inverso)</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnGenerate}`} onClick={onGenerate}>
          Generar Vista Previa
        </button>
        {isGenerated && (
          <button className={`${styles.btn} ${styles.btnPrint}`} onClick={onPrint}>
            Imprimir Ahora
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
