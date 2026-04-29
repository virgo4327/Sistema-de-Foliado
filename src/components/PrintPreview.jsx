import React, { useState, useEffect } from 'react';
import FolioPage from './FolioPage';

const PrintPreview = ({ pages, pageSize }) => {
  const [rendered, setRendered] = useState([]);

  useEffect(() => {
    // 1. Limpiar el estado renderizado si cambia el array pages para evitar duplicados
    setRendered([]);
    
    if (pages.length === 0) return;

    let currentIndex = 0;
    const batchSize = 100;
    let timeoutId;

    // 2. Función recursiva diferida para renderizar en lotes (batching)
    const renderNextBatch = () => {
      const nextBatch = pages.slice(currentIndex, currentIndex + batchSize);
      
      setRendered(prev => [...prev, ...nextBatch]);
      currentIndex += batchSize;

      // Si aún faltan folios, agendar el siguiente lote liberando el hilo principal
      if (currentIndex < pages.length) {
        timeoutId = setTimeout(renderNextBatch, 50); // 50ms de delay
      }
    };

    // Iniciar el primer lote
    timeoutId = setTimeout(renderNextBatch, 50);

    // Limpieza del timeout si el componente se desmonta o cambia `pages`
    return () => clearTimeout(timeoutId);
  }, [pages]);

  if (pages.length === 0) return null;

  return (
    <div className="print-preview print-container">
      {/* 3. Mostrar texto de progreso solo durante la carga */}
      {rendered.length < pages.length && (
        <div style={{ textAlign: 'center', padding: '20px', fontWeight: 'bold' }}>
          Cargando... {rendered.length} / {pages.length}
        </div>
      )}
      
      {/* Renderizado de folios */}
      {rendered.map((num) => (
        <FolioPage key={num} number={num} pageSize={pageSize} />
      ))}
    </div>
  );
};

export default PrintPreview;

