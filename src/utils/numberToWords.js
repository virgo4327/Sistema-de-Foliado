export function numberToWords(n) {
  if (n === 0) return 'Cero';

  const units = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
  const teens = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
  const tens = ['', '', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
  const hundreds = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

  function convertGroup(num) {
    let result = '';

    if (num === 100) return 'Cien';
    
    if (num >= 100) {
      result += hundreds[Math.floor(num / 100)] + ' ';
      num %= 100;
    }

    if (num >= 20) {
      if (num === 20) return result + 'Veinte';
      if (num < 30) {
        result += 'Veinti' + units[num % 10].toLowerCase();
      } else {
        result += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' y ' + units[num % 10] : '');
      }
    } else if (num >= 10) {
      result += teens[num - 10];
    } else if (num > 0) {
      result += units[num];
    }

    return result.trim();
  }

  if (n === 1000000) return 'Un Millón';
  
  let finalResult = '';
  
  // Miles
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    if (thousands === 1) {
      finalResult += 'Mil ';
    } else {
      finalResult += convertGroup(thousands) + ' Mil ';
    }
    n %= 1000;
  }

  // Resto
  if (n > 0) {
    finalResult += convertGroup(n);
  }

  return finalResult.trim();
}
