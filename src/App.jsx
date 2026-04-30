import React, { useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import PrintPreview from './components/PrintPreview';

function App() {
  const [startNumber, setStartNumber] = useState('');
  const [endNumber, setEndNumber] = useState('');
  const [pageSize, setPageSize] = useState('A4');
  const [printOrder, setPrintOrder] = useState('asc');
  const [pages, setPages] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = () => {
    const start = typeof startNumber === 'string' ? parseInt(startNumber) || 1 : startNumber;
    const end = typeof endNumber === 'string' ? parseInt(endNumber) || start : endNumber;
    
    if (start < 1 || end < start) {
      alert('Por favor ingrese números válidos y asegúrese que el número final sea mayor o igual al inicial');
      return;
    }

    const qty = end - start + 1;

    let newPages = Array.from({ length: qty }, (_, i) => start + i);
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
    setStartNumber('');
    setEndNumber('');
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
