import React, { useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import PrintPreview from './components/PrintPreview';

function App() {
  const [startNumber, setStartNumber] = useState(1);
  const [endNumber, setEndNumber] = useState(1);
  const [pageSize, setPageSize] = useState('A4');
  const [printOrder, setPrintOrder] = useState('asc');
  const [pages, setPages] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = () => {
    const start = typeof startNumber === 'string' ? parseInt(startNumber) || 1 : startNumber;
    const end = typeof endNumber === 'string' ? parseInt(endNumber) || 1 : endNumber;
    
    if (start < 1 || end < 1) {
      alert('Por favor ingrese números válidos mayores a 0');
      return;
    }

    if (end < start) {
      alert('El número final debe ser mayor o igual al inicial');
      return;
    }

    let quantity = end - start + 1;
    let newPages = Array.from({ length: quantity }, (_, i) => start + i);
    if (printOrder === 'desc') {
      newPages.reverse();
    }
    
    setPages(newPages);
    setIsGenerated(true);
    
    setTimeout(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClear = () => {
    setStartNumber(1);
    setEndNumber(1);
    setPageSize('A4');
    setPages([]);
    setIsGenerated(false);
  };

  return (
    <div className="app-container">
      <ConfigPanel 
        startNumber={startNumber}
        setStartNumber={setStartNumber}
        endNumber={endNumber}
        setEndNumber={setEndNumber}
        pageSize={pageSize}
        setPageSize={setPageSize}
        printOrder={printOrder}
        setPrintOrder={setPrintOrder}
        onGenerate={handleGenerate}
        onPrint={handlePrint}
        onClear={handleClear}
        isGenerated={isGenerated}
      />
      
      <PrintPreview pages={pages} pageSize={pageSize} />
    </div>
  );
}

export default App;
