import React from 'react';
import { numberToWords } from '../utils/numberToWords';
import styles from '../styles/FolioPage.module.css';

const FolioPage = ({ number, pageSize }) => {
  const formattedNumber = number.toString().padStart(2, '0');
  const wordsRaw = numberToWords(number);
  const words = wordsRaw.charAt(0).toUpperCase() + wordsRaw.slice(1).toLowerCase();
  const digits = formattedNumber.split('');

  return (
    <div className={`${styles.page} ${styles[pageSize.toLowerCase()]}`}>
      <div className={styles.folioContainer}>
        <div className={styles.numberVertical}>
          {digits.map((digit, index) => (
            <span 
              key={index} 
              className={index === digits.length - 1 ? styles.lastDigit : ''}
            >
              {digit}
            </span>
          ))}
        </div>
        <div className={styles.words}>
          {words.split('').map((char, index) => (
            char === ' ' ? <span key={index} className={styles.space}>&nbsp;</span> : <span key={index}>{char}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FolioPage;
