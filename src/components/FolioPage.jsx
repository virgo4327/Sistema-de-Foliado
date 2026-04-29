import React from 'react';
import { numberToWords } from '../utils/numberToWords';
import styles from '../styles/FolioPage.module.css';

const FolioPage = ({ number, pageSize }) => {
  const formattedNumber = number.toString().padStart(2, '0');
  const wordsRaw = numberToWords(number);
  // Usamos non-breaking spaces para que no colapsen los márgenes de word-break: break-all
  const words = (wordsRaw.charAt(0).toUpperCase() + wordsRaw.slice(1).toLowerCase()).replace(/ /g, '\u00A0');
  
  const initialDigits = formattedNumber.slice(0, -1);
  const lastDigit = formattedNumber.slice(-1);

  return (
    <div className={`${styles.page} ${styles[pageSize.toLowerCase()]}`}>
      <div className={styles.folioContainer}>
        <div className={styles.numberVertical}>
          {initialDigits && <div className={styles.numberText}>{initialDigits}</div>}
          <div className={styles.lastDigit}>{lastDigit}</div>
        </div>
        <div className={styles.words}>
          {words}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FolioPage);
