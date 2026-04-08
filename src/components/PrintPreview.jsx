import React from 'react';
import FolioPage from './FolioPage';

const PrintPreview = ({ pages, pageSize }) => {
  if (pages.length === 0) return null;

  return (
    <div className="print-preview print-container">
      {pages.map((num) => (
        <FolioPage key={num} number={num} pageSize={pageSize} />
      ))}
    </div>
  );
};

export default PrintPreview;
